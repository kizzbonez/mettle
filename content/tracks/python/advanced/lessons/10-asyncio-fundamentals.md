---
title: asyncio Fundamentals
summary: Write coroutines with `async def` and `await`, run them on the event loop with `asyncio.run`, run many at once as tasks with `gather` and `TaskGroup`, wait with timeouts, pass work through `asyncio.Queue`, and keep blocking calls off the loop.
minutes: 45
objectives:
  - Explain what a coroutine is, what `await` does, and what the event loop does
  - Run coroutines concurrently as tasks, and collect results with `gather` and `TaskGroup`
  - Handle failure and cancellation in a `TaskGroup`, and bound a wait with `asyncio.timeout`
  - Coordinate tasks with `asyncio.Event` and `asyncio.Queue`
  - Recognise blocking calls and move them off the event loop with `asyncio.to_thread`
---

## Outline

1. One thread, many waiting tasks
2. Coroutines, `await` and the event loop
3. Tasks: running coroutines concurrently
4. `gather` and `TaskGroup`
5. Timeouts and events
6. `asyncio.Queue`
7. Never block the loop

## One thread, many waiting tasks

The last lesson used threads for I/O-bound work. **asyncio** solves the same problem with a
single thread. Each job is a **coroutine**, a function that can pause at points you mark and
resume later. While one coroutine waits for a network reply or a timer, another runs. Switching
happens only at those marked points, so this is **cooperative multitasking**: no data changes
under your feet between two lines that do not pause, which removes most race conditions.
asyncio is concurrency, not parallelism: CPU-bound work still needs processes.

## Coroutines, `await` and the event loop

`async def` defines a **coroutine function**. Calling it runs nothing; it returns a **coroutine
object**. `await` runs a coroutine (or another *awaitable*) and gives its result; it may only
appear inside an `async def`. The **event loop** is the scheduler that runs coroutines, pausing
one at each `await` that must wait and resuming another that is ready. `asyncio.run(main())`
creates a loop, runs `main` to completion and closes the loop: one call at the top of a program.

```python
import asyncio


async def brew(drink, steps):
    for step in range(1, steps + 1):
        print(f"{drink}: step {step}")
        await asyncio.sleep(0)  # pause here and let other tasks run
    return f"{drink} ready"


async def main():
    coro = brew("tea", 2)
    print(type(coro).__name__)
    print(await coro)
    tea = asyncio.create_task(brew("tea", 2))
    coffee = asyncio.create_task(brew("coffee", 3))
    print(await tea, "|", await coffee)


asyncio.run(main())
```

```text
coroutine
tea: step 1
tea: step 2
tea ready
tea: step 1
coffee: step 1
tea: step 2
coffee: step 2
coffee: step 3
tea ready | coffee ready
```

`await coro` ran the first tea alone: awaiting a coroutine directly does not create concurrency.
`asyncio.sleep(seconds)` pauses only the current coroutine; the docs note that a delay of `0`
simply lets other tasks run, which makes the interleaving visible here.

## Tasks: running coroutines concurrently

`asyncio.create_task(coro)` wraps a coroutine in a **task** and schedules it on the loop at once.
The two tasks above took turns at each `await`: the loop runs ready tasks in the order they
became ready. `await tea` waits for the task to finish and returns its result. The docs warn that
the loop keeps only weak references to tasks, so keep a reference (a variable, a list) until each
task is done, or it may disappear mid-execution.

A coroutine called without `await` never runs, and Python warns about it:

```text
RuntimeWarning: coroutine 'greet' was never awaited
```

## `gather` and `TaskGroup`

`asyncio.gather(*aws)` runs awaitables concurrently and returns their results **in the order of
the arguments**, whatever order they finish in. Added to `main` above:

```python
results = await asyncio.gather(brew("a", 3), brew("b", 1))
print(results)  # ['a ready', 'b ready'], although b finished first
```

If one of them raises, `gather` passes the exception on, but the others keep running unattended.
`asyncio.TaskGroup`, an **async context manager** used with `async with`, gives stronger
guarantees. Tasks created with `tg.create_task` all finish before the block ends. If one fails,
the group **cancels** the others, waits for them, and raises the failures together in an
`ExceptionGroup`, which you handle with `except*` from Idiomatic Python.

```python
import asyncio


async def inspect(item):
    await asyncio.sleep(0)
    if item == "cracked mug":
        raise ValueError(f"rejected {item}")
    return f"{item} ok"


async def wait_for_signal(signal):
    try:
        await signal.wait()
    except asyncio.CancelledError:
        print("waiter cancelled")
        raise


async def main():
    signal = asyncio.Event()
    try:
        async with asyncio.TaskGroup() as tg:
            plate = tg.create_task(inspect("plate"))
            tg.create_task(inspect("cracked mug"))
            tg.create_task(wait_for_signal(signal))
    except* ValueError as group:
        print([str(error) for error in group.exceptions])
    print(plate.result())


asyncio.run(main())
```

```text
waiter cancelled
['rejected cracked mug']
plate ok
```

**Cancellation** is delivered as `asyncio.CancelledError`, raised at the `await` where the task
is paused. Catch it only to clean up, and re-raise it, as `wait_for_signal` does. Prefer
`TaskGroup` for new code; it is the **structured concurrency** tool: no task outlives the block
that started it. Python 3.15 adds `tg.cancel()`, which ends a group early without an error.

## Timeouts and events

An `asyncio.Event` is the coroutine version of `threading.Event`: `await event.wait()` pauses
until another task calls `event.set()`. To limit how long anything may take, wrap it in
`async with asyncio.timeout(seconds)`, which cancels the work and raises `TimeoutError`:

```python
import asyncio


async def main():
    never_set = asyncio.Event()
    try:
        async with asyncio.timeout(0.05):
            await never_set.wait()
    except TimeoutError:
        print("gave up waiting")


asyncio.run(main())
```

```text
gave up waiting
```

## `asyncio.Queue`

`asyncio.Queue` is the coroutine version of `queue.Queue`: `await queue.get()` pauses until an
item arrives. `task_done()` marks an item finished and `await queue.join()` waits until every
item put has been marked.

```python
import asyncio


async def cook(orders, served):
    while True:
        order = await orders.get()
        await asyncio.sleep(0)  # pretend to cook
        served.append(order)
        orders.task_done()


async def kitchen():
    orders = asyncio.Queue()
    served = []
    for order in ["soup", "salad", "pasta", "pie", "tea"]:
        await orders.put(order)
    async with asyncio.TaskGroup() as tg:
        for _ in range(2):
            tg.create_task(cook(orders, served))
        await orders.join()  # wait until every order is marked done
        tg.cancel()  # new in 3.15: stop the cooks
    print(sorted(served), orders.empty())


asyncio.run(kitchen())
```

```text
['pasta', 'pie', 'salad', 'soup', 'tea'] True
```

Which cook served which order depends on scheduling, so the program checks completeness by
sorting. Professional Python returns to queues, semaphores and cancellation in depth.

## Never block the loop

The event loop can switch tasks only at an `await`. A **blocking** call, such as `time.sleep`,
`urllib.request.urlopen`, reading a large file or a long calculation, holds the only thread and freezes
every task. The `asyncio` development guide gives the example of a one-second calculation
delaying all tasks by a second. `await asyncio.to_thread(func, *args)` runs a blocking function
in a worker thread while the loop carries on:

```python
import asyncio
import threading


async def ticker(gate, log):
    for n in range(3):
        log.append(f"tick {n}")
        await asyncio.sleep(0)
    gate.set()


async def blocking_wait(gate, log):
    opened = gate.wait(timeout=0.2)  # a blocking call: the whole loop stops here
    log.append(f"blocking wait, gate opened: {opened}")


async def threaded_wait(gate, log):
    opened = await asyncio.to_thread(gate.wait, 2)  # blocks a worker thread instead
    log.append(f"threaded wait, gate opened: {opened}")


async def run(waiter):
    gate = threading.Event()
    log = []
    async with asyncio.TaskGroup() as tg:
        tg.create_task(waiter(gate, log))
        tg.create_task(ticker(gate, log))
    print(log)


asyncio.run(run(blocking_wait))
asyncio.run(run(threaded_wait))
```

```text
['blocking wait, gate opened: False', 'tick 0', 'tick 1', 'tick 2']
['tick 0', 'tick 1', 'tick 2', 'threaded wait, gate opened: True']
```

The blocking version froze the loop, so the ticker that would open the gate could not run until
the wait had timed out. With `to_thread`, the ticker ran and the gate opened.

## Common mistakes

- **Forgetting `await`.** `brew("tea", 2)` alone does nothing and warns `coroutine ... was never
  awaited`.
- **`time.sleep` in a coroutine.** It blocks every task; use `await asyncio.sleep`.
- **Awaiting one coroutine after another and expecting overlap.** Create tasks, or use
  `gather` or a `TaskGroup`.
- **Swallowing `CancelledError`.** A task that catches it without re-raising cannot be stopped
  properly.
- **Calling `asyncio.run` inside a coroutine.** It fails because a loop is already running; use
  `await` instead.

## Practice

1. Write `async def countdown(name, n)` that prints `name: n` down to 1, pausing with
   `asyncio.sleep(0)`, and run two of them in a `TaskGroup`. In what order do the lines appear?
2. Collect the results of `brew("x", 2)`, `brew("y", 1)` and `brew("z", 3)` in argument order.
3. Why is `await asyncio.to_thread(time.sleep, 1)` acceptable in a coroutine while
   `time.sleep(1)` is not?

### Answers

1. They alternate, because each `sleep(0)` hands the turn to the other ready task:

   ```python
   async def countdown(name, n):
       for i in range(n, 0, -1):
           print(f"{name}: {i}")
           await asyncio.sleep(0)


   async def main():
       async with asyncio.TaskGroup() as tg:
           tg.create_task(countdown("A", 2))
           tg.create_task(countdown("B", 2))


   asyncio.run(main())  # A: 2, B: 2, A: 1, B: 1
   ```

2. `await asyncio.gather(brew("x", 2), brew("y", 1), brew("z", 3))` returns
   `['x ready', 'y ready', 'z ready']`.
3. `to_thread` sleeps in a worker thread and the coroutine awaits the result, so the loop keeps
   running other tasks. `time.sleep(1)` stops the loop's own thread for a second.

## Key takeaways

- `async def` makes coroutine functions; calling one creates a coroutine that runs only when
  awaited or wrapped in a task.
- `asyncio.run` starts the event loop; tasks switch only at `await`.
- `gather` returns results in argument order; `TaskGroup` also cancels siblings on failure.
- `asyncio.timeout`, `Event` and `Queue` bound and coordinate waiting.
- Never block the loop; move blocking calls to `asyncio.to_thread`.

## Further reading

- [asyncio: coroutines and tasks](https://docs.python.org/3.15/library/asyncio-task.html)
- [asyncio: queues](https://docs.python.org/3.15/library/asyncio-queue.html)
- [Developing with asyncio](https://docs.python.org/3.15/library/asyncio-dev.html)
- [PEP 492: coroutines with async and await syntax](https://peps.python.org/pep-0492/)
