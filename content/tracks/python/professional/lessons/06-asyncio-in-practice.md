---
title: asyncio in Practice
summary: Write asyncio programs that hold up in production. Use TaskGroup for structured concurrency, clean up on cancellation, put deadlines on work with asyncio.timeout, limit concurrency with a semaphore, pipeline work through queues, move blocking calls to threads, and handle the errors of many tasks at once.
minutes: 40
objectives:
  - Run related tasks in a TaskGroup and handle their failures with except*
  - Write coroutines that clean up on cancellation and never swallow CancelledError
  - Bound work with asyncio.timeout and limit concurrency with asyncio.Semaphore
  - Build a producer and consumers around an asyncio.Queue, with async iterators and async context managers
  - Call blocking code with asyncio.to_thread
---

## Outline

1. Structured concurrency with TaskGroup
2. Cancellation and cleanup
3. Deadlines and limits
4. Producers, consumers and queues
5. Async iterators and async context managers
6. Blocking code: `asyncio.to_thread`
7. Errors from many tasks

## Structured concurrency with TaskGroup

The advanced level introduced coroutines, `asyncio.run`, tasks and `TaskGroup`. In a service the
hard part is not starting tasks but **ending** them: what happens when one fails, when the user
presses Ctrl+C, when a call hangs. **Structured concurrency** answers with one rule: every task
belongs to a block of code, and the block does not end until all of its tasks have ended.
`asyncio.TaskGroup` is that block:

```python
import asyncio


async def check_sensor(name, delay, broken=False):
    try:
        await asyncio.sleep(delay)
        if broken:
            raise ConnectionError(f"{name} did not answer")
        print(f"{name}: ok")
        return name
    except asyncio.CancelledError:
        print(f"{name}: cancelled")
        raise
    finally:
        print(f"{name}: connection closed")


async def main():
    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(check_sensor("roof", 0.01))
            group.create_task(check_sensor("cellar", 0.02, broken=True))
            group.create_task(check_sensor("garage", 0.5))
    except* ConnectionError as errors:
        for error in errors.exceptions:
            print("failed:", error)


asyncio.run(main())
```

```text
roof: ok
roof: connection closed
cellar: connection closed
garage: cancelled
garage: connection closed
failed: cellar did not answer
```

When `cellar` failed, the group cancelled `garage` at once instead of waiting half a second for a
result nobody would use, waited for it to finish cleaning up, and then raised the failures as an
`ExceptionGroup`. `except*` (advanced level, exceptions in depth) picks the `ConnectionError`s out
of it. No task outlives the `async with` block, so none can fail later with nobody listening.

## Cancellation and cleanup

**Cancelling** a task makes `asyncio.CancelledError` appear at the `await` where it is waiting.
Two rules follow:

- Put cleanup (closing connections, removing temporary files) in `finally` or in a context
  manager, so it runs on success, error and cancellation alike.
- If you catch `CancelledError` to log or tidy up, **re-raise it**, as `check_sensor` does.
  Swallowing it breaks `TaskGroup` and `asyncio.timeout`, which rely on cancellation arriving.

## Deadlines and limits

`async with asyncio.timeout(seconds):` cancels the block when the time runs out and turns the
cancellation into `TimeoutError` outside it. A **semaphore** holds a number of permits;
`async with semaphore:` takes one, waiting if none is free, and gives it back at the end. It stops
a program from opening a thousand connections at once:

```python
import asyncio

running = 0
peak = 0


async def download(name, seconds, limit):
    global running, peak
    async with limit:
        running += 1
        peak = max(peak, running)
        try:
            await asyncio.sleep(seconds)
            return f"{name} done"
        finally:
            running -= 1


async def download_with_deadline(name, seconds, limit):
    try:
        async with asyncio.timeout(0.5):
            return await download(name, seconds, limit)
    except TimeoutError:
        return f"{name} timed out"


async def main():
    limit = asyncio.Semaphore(3)
    jobs = {f"file{n}": 0.02 for n in range(8)}
    jobs["huge"] = 5
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(download_with_deadline(name, seconds, limit))
                 for name, seconds in jobs.items()]
    print([task.result() for task in tasks])
    print("at most", peak, "at once")


asyncio.run(main())
```

```text
['file0 done', 'file1 done', 'file2 done', 'file3 done', 'file4 done', 'file5 done', 'file6 done', 'file7 done', 'huge timed out']
at most 3 at once
```

The deadline covers everything inside the block, including the wait for a permit. The `global`
counters are only there to measure the peak. Because only one coroutine runs at a time between
`await`s, they need no lock.

## Producers, consumers and queues

An `asyncio.Queue` connects **producers**, which `put` work, to **consumers**, which `get` it. With
`maxsize`, `put` waits while the queue is full, which slows a fast producer down to the speed of
its consumers (**back-pressure**). Since Python 3.13, `queue.shutdown()` tells consumers the work is
over: once the queue is empty, `get` raises `asyncio.QueueShutDown`. That replaces the old
"sentinel value" and cancelling of workers.

## Async iterators and async context managers

An **async iterator** produces values with `await`s in between and is read with `async for`. The
easy way to write one is an **async generator**: an `async def` function with `yield`. An **async
context manager** has `__aenter__` and `__aexit__` coroutines and is used with `async with`;
`contextlib.asynccontextmanager` builds one from an async generator, the way
`contextmanager` does for ordinary ones. All of it together:

```python
import asyncio
from contextlib import asynccontextmanager


async def readings(count):
    """Yield one reading at a time, waiting between them (an async generator)."""
    for number in range(1, count + 1):
        await asyncio.sleep(0.01)
        yield {"id": number, "celsius": 19 + number}


@asynccontextmanager
async def database(name):
    print(f"open {name}")
    try:
        yield []
    finally:
        print(f"close {name}")


async def producer(queue):
    async for reading in readings(5):
        await queue.put(reading)
    queue.shutdown()


async def consumer(name, queue, rows):
    while True:
        try:
            reading = await queue.get()
        except asyncio.QueueShutDown:
            return
        rows.append((name, reading["id"]))
        await asyncio.sleep(0.015)
        queue.task_done()


async def main():
    queue = asyncio.Queue(maxsize=2)
    async with database("metrics") as rows:
        async with asyncio.TaskGroup() as group:
            group.create_task(producer(queue))
            group.create_task(consumer("A", queue, rows))
            group.create_task(consumer("B", queue, rows))
        print(sorted(reading_id for _, reading_id in rows))


asyncio.run(main())
```

```text
open metrics
[1, 2, 3, 4, 5]
close metrics
```

## Blocking code: `asyncio.to_thread`

The event loop runs one coroutine at a time, so a function that blocks (`time.sleep`, a
synchronous HTTP library, a slow file system call) freezes every other task. `asyncio.to_thread`
runs it in a worker thread and gives you something to `await`:

```python
import asyncio
import time


def resize_image(name):
    time.sleep(0.2)          # stands for a blocking library call
    return f"{name} resized"


async def main():
    start = time.perf_counter()
    for name in ["a.jpg", "b.jpg"]:
        resize_image(name)   # blocks the whole event loop
    print(f"in the loop: {time.perf_counter() - start:.1f} s")

    start = time.perf_counter()
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(asyncio.to_thread(resize_image, name))
                 for name in ["a.jpg", "b.jpg"]]
    print([task.result() for task in tasks])
    print(f"in threads: {time.perf_counter() - start:.1f} s")


asyncio.run(main())
```

```text
in the loop: 0.4 s
['a.jpg resized', 'b.jpg resized']
in threads: 0.2 s
```

Because of the GIL (advanced level), threads help with waiting, not with pure Python computation.
For CPU-heavy work use a process pool through `loop.run_in_executor`.

## Errors from many tasks

- **TaskGroup**: the first failure cancels the rest, and all failures arrive together in an
  `ExceptionGroup`. Use it when the tasks only make sense together.
- **`asyncio.gather(..., return_exceptions=True)`**: every task runs to the end and exceptions
  come back as values in the result list, so one bad page does not lose the others:
  `[10, ValueError('bad page 2'), 30]`. Check each item with `isinstance(result, Exception)`.
- **Ending early on success**: Python 3.15 adds `TaskGroup.cancel()`, which cancels the
  remaining tasks and leaves the `async with` block *without* an error:

```python
import asyncio


async def ask_mirror(name, seconds, group, answers, cancelled):
    try:
        await asyncio.sleep(seconds)
    except asyncio.CancelledError:
        cancelled.append(name)
        raise
    answers.append(name)
    group.cancel()           # new in 3.15: end the group early, without an error


async def main():
    answers, cancelled = [], []
    async with asyncio.TaskGroup() as group:
        for name, seconds in [("eu", 0.03), ("us", 0.01), ("asia", 0.05)]:
            group.create_task(ask_mirror(name, seconds, group, answers, cancelled))
    print("answered:", answers, "cancelled:", sorted(cancelled))


asyncio.run(main())
```

```text
answered: ['us'] cancelled: ['asia', 'eu']
```

## Common mistakes

- **Swallowing cancellation.** A loop with `except asyncio.CancelledError: print("ignoring")`
  keeps running, so `asyncio.timeout(0.05)` never ends it and the program hangs. Re-raise.
- **Fire-and-forget tasks.** `asyncio.create_task(job())` without keeping the result: the loop
  holds only a weak reference, so the task may vanish, and its exception goes unseen. Use a
  `TaskGroup`.
- **Blocking calls in a coroutine.** `time.sleep(1)` stalls every task; use `await asyncio.sleep(1)`
  or `asyncio.to_thread`.
- **Unbounded fan-out.** Starting one task per URL for 50,000 URLs exhausts sockets. Add a
  semaphore or a fixed number of queue consumers.

## Practice

1. Change `download_with_deadline` so the deadline applies only to the download itself, not the
   wait for a permit.
2. In the queue example, what happens if the producer forgets `queue.shutdown()`?
3. Run three checks with `gather(return_exceptions=True)` and print how many failed.

### Answers

1. Take the permit outside the timeout:
   ```python
   async def download_with_deadline(name, seconds, limit):
       async with limit:
           try:
               async with asyncio.timeout(0.5):
                   await asyncio.sleep(seconds)
                   return f"{name} done"
           except TimeoutError:
               return f"{name} timed out"
   ```
2. The consumers wait in `get()` forever, so the `TaskGroup` never ends and the program hangs.
3. `results = await asyncio.gather(*checks, return_exceptions=True)`, then
   `print(sum(isinstance(r, Exception) for r in results))`.

## Key takeaways

- A `TaskGroup` owns its tasks: one failure cancels the rest and errors arrive as an `ExceptionGroup`.
- Clean up in `finally`, and always re-raise `CancelledError`.
- `asyncio.timeout` bounds time; `Semaphore` bounds concurrency; `Queue(maxsize)` bounds memory.
- `queue.shutdown()` (3.13) ends consumers cleanly; `TaskGroup.cancel()` (3.15) ends a group early.
- Blocking calls go to `asyncio.to_thread`.

## Further reading

- [Coroutines and Tasks](https://docs.python.org/3.15/library/asyncio-task.html)
- [asyncio Queues](https://docs.python.org/3.15/library/asyncio-queue.html)
- [asyncio Synchronization Primitives](https://docs.python.org/3.15/library/asyncio-sync.html)
- [Developing with asyncio](https://docs.python.org/3.15/library/asyncio-dev.html)
