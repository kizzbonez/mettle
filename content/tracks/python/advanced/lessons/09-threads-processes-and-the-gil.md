---
title: Threads, Processes and the GIL
summary: Tell concurrency from parallelism and I/O-bound from CPU-bound work, run threads safely with locks, events and queues, understand the GIL and the free-threaded build, and use processes and `concurrent.futures` pools.
minutes: 45
objectives:
  - Explain concurrency, parallelism, and why I/O-bound and CPU-bound work need different tools
  - Start and join threads, and prevent race conditions with `threading.Lock`
  - Coordinate threads with `threading.Event` and `queue.Queue`
  - Explain what the GIL does, how the free-threaded build differs, and when to use processes
  - Run work in pools with `ThreadPoolExecutor` and `ProcessPoolExecutor`
---

## Outline

1. Concurrency and parallelism
2. Threads
3. Race conditions and locks
4. Queues and the producer/consumer pattern
5. The GIL and the free-threaded build
6. Processes
7. `concurrent.futures` pools

## Concurrency and parallelism

**Concurrency** means several tasks are in progress during the same period, taking turns.
**Parallelism** means several tasks run at the same instant, on different processor cores.
A single cook who starts the rice, then chops vegetables while it boils, is concurrent; two cooks
are parallel.

Which you need depends on what the work waits for:

- **I/O-bound** work spends most of its time waiting for a network, a disk or a user. Taking
  turns is enough: while one task waits, another runs.
- **CPU-bound** work keeps a core busy calculating. Only running on more cores makes it faster.

## Threads

A **thread** is a separate flow of execution inside the same process, sharing all its memory.
`threading.Thread(target=func, args=(...))` creates one, `start()` runs it, and `join()` waits
for it to finish.

```python
import threading
import time


def fetch(page, results):
    time.sleep(0.2)  # stands in for waiting on a network reply
    results[page] = f"<html>{page}</html>"


results = {}
threads = [threading.Thread(target=fetch, args=(page, results)) for page in ["home", "about", "shop"]]
start = time.perf_counter()
for thread in threads:
    thread.start()
for thread in threads:
    thread.join()
elapsed = time.perf_counter() - start
print(sorted(results))
print(f"three 0.2 s waits finished in under 0.4 s: {elapsed < 0.4}")
```

```text
['about', 'home', 'shop']
three 0.2 s waits finished in under 0.4 s: True
```

The three waits overlapped. The threads finish in an order nobody controls, so the program
**sorts** what it prints: concurrent code must never depend on which thread happens to run first.
A thread cannot return a value to `join()`, so each one stores its result in a shared dict.

## Race conditions and locks

Shared memory is convenient and dangerous. A **race condition** is a bug where the result depends
on how threads interleave. The classic case is *check, then act*: read a value, decide, write
it back. Here two `threading.Event` objects force the unlucky interleaving so it happens every
time. An **event** is a flag: `set()` raises it and `wait()` blocks until it is raised.

```python
import threading

stock = {"tickets": 1}
a_has_read = threading.Event()
b_has_written = threading.Event()


def buyer_a():
    left = stock["tickets"]
    a_has_read.set()
    b_has_written.wait()  # buyer B runs in this gap
    if left > 0:
        stock["tickets"] = left - 1
        print("A bought a ticket")


def buyer_b():
    a_has_read.wait()
    left = stock["tickets"]
    if left > 0:
        stock["tickets"] = left - 1
        print("B bought a ticket")
    b_has_written.set()


threads = [threading.Thread(target=buyer_a), threading.Thread(target=buyer_b)]
for thread in threads:
    thread.start()
for thread in threads:
    thread.join()
print(f"tickets left: {stock['tickets']}, but two were sold")
```

```text
B bought a ticket
A bought a ticket
tickets left: 0, but two were sold
```

In real programs the gap is a rare accident of timing, which makes such bugs hard to reproduce.
The fix is a **lock** (`threading.Lock`): only one thread can hold it at a time, and the others
wait. Used with `with`, it is always released, even on an exception.

```python
import threading

stock = {"tickets": 3}
sold = []
lock = threading.Lock()


def buy(name):
    with lock:  # check and update as one step
        if stock["tickets"] > 0:
            stock["tickets"] -= 1
            sold.append(name)


buyers = [threading.Thread(target=buy, args=(f"buyer-{n}",)) for n in range(10)]
for thread in buyers:
    thread.start()
for thread in buyers:
    thread.join()
print(len(sold), stock["tickets"])
```

```text
3 0
```

Which three buyers win varies from run to run; that exactly three win does not. Keep the locked
section short, and never wait for one lock while holding another unless every thread takes them
in the same order, or two threads can block each other forever (a **deadlock**).

## Queues and the producer/consumer pattern

Often the safest design shares nothing directly and passes messages instead. `queue.Queue` is a
thread-safe first-in, first-out queue: `put(item)` adds, and `get()` removes, blocking until an
item is available. **Workers** take jobs from one queue and put results on another. A
**sentinel**, here `None`, tells each worker to stop.

```python
import queue
import threading

jobs = queue.Queue()
results = queue.Queue()


def worker():
    while True:
        text = jobs.get()
        if text is None:  # sentinel: no more work
            break
        results.put((text, len(text.split())))


workers = [threading.Thread(target=worker) for _ in range(3)]
for thread in workers:
    thread.start()
for text in ["a b c", "d e", "f", "g h i j"]:
    jobs.put(text)
for _ in workers:
    jobs.put(None)
for thread in workers:
    thread.join()
print(sorted(results.get() for _ in range(results.qsize())))
```

```text
[('a b c', 3), ('d e', 2), ('f', 1), ('g h i j', 4)]
```

## The GIL and the free-threaded build

The standard CPython build has a **global interpreter lock** (GIL): only one thread executes
Python bytecode at a time. Threads still help I/O-bound work, because a thread releases the GIL
while it waits. But CPU-bound Python code in several threads runs no faster than in one, and the
`threading` documentation advises processes for using several cores.

Python 3.13 introduced a **free-threaded build** (PEP 703) in which the GIL is disabled and
threads run Python code in parallel. Since 3.14 it is officially supported (PEP 779), but it is a separate
interpreter, usually named with a `t` suffix such as `python3.15t`, and not the default; in 3.15
the official macOS installer includes it by default. The docs list the trade-offs: single-threaded
code runs slower (about 1% to 8% on their benchmarks), and the GIL is switched back on if you
import a C extension that does not declare support for free threading. Check which build you run:

```python
import sys
import sysconfig

print(sys._is_gil_enabled(), sysconfig.get_config_var("Py_GIL_DISABLED"))
```

```text
True 0
```

This is the standard build, so the GIL is on. Locks remain necessary in both builds: the GIL
never protected a check-then-act sequence like the ticket sale.

## Processes

A **process** has its own interpreter and memory, so processes run in parallel on any build. The
`multiprocessing` module mirrors `threading` (`Process`, `Queue`, `Pool`). The costs: starting a
process is slow, and arguments and results travel between processes by **pickling**
(serialising), so they must be picklable, which rules out lambdas. New processes are started with
*spawn* on Windows and macOS and, since 3.14, *forkserver* on Linux; both import your main module
in the child, so the code that starts processes must sit under
`if __name__ == "__main__":`.

## `concurrent.futures` pools

`concurrent.futures` gives threads and processes one interface. An **executor** owns a pool of
workers. `pool.map(func, items)` returns the results **in input order**. `pool.submit(func, arg)`
returns a **future**, a placeholder whose `result()` waits for the value or re-raises the
exception. `as_completed(futures)` yields futures as they finish.

```python
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed


def count_primes(limit):
    """CPU-bound work: count the primes below limit by trial division."""
    count = 0
    for n in range(2, limit):
        if all(n % d for d in range(2, int(n**0.5) + 1)):
            count += 1
    return count


if __name__ == "__main__":
    with ProcessPoolExecutor(max_workers=4) as pool:
        print(list(pool.map(count_primes, [10_000, 20_000, 30_000, 40_000])))

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(str.upper, word) for word in ["kiwi", "fig", "lime"]]
        print(sorted(future.result() for future in as_completed(futures)))
        failed = pool.submit(int, "ten")
        print(repr(failed.exception()))
```

```text
[1229, 2262, 3245, 4203]
['FIG', 'KIWI', 'LIME']
ValueError("invalid literal for int() with base 10: 'ten'")
```

The `with` block waits for all work and shuts the pool down. Choose `ThreadPoolExecutor` for
I/O-bound jobs and `ProcessPoolExecutor` for CPU-bound ones.

## Common mistakes

- **Relying on thread order.** Output order changes between runs; sort results or use queues.
- **Unprotected check-then-act.** Even with the GIL, read-modify-write sequences race. Hold a
  lock for the whole sequence.
- **Threads for CPU-bound work on the standard build.** They take turns on one core; use
  processes.
- **No `__main__` guard with processes.** Each child imports the main module and tries to start
  processes again. The children stop with a `RuntimeError` about the "bootstrapping phase", and
  a pool reports `BrokenProcessPool`.

## Practice

1. Ten threads each add 1,000 to a shared counter with `counter += 1`. What makes the result
   correct, and why is it needed?
2. Change the queue example so that the workers compute `len(text)` instead, and print the total.
3. Which executor would you pick to resize 500 photos with pure Python code, and which to
   download 500 pages?

### Answers

1. `+=` reads, adds and writes in separate steps, so two threads can read the same old value
   and one update is lost. Hold a lock around it:

   ```python
   with lock:
       counter += 1
   ```

2. Put `(text, len(text))` on the results queue and print
   `sum(n for _, n in sorted_results)`: `5 + 3 + 1 + 7 = 16`.
3. Resizing in pure Python is CPU-bound: `ProcessPoolExecutor`. Downloading is I/O-bound:
   `ThreadPoolExecutor`, or asyncio, the next lesson.

## Key takeaways

- I/O-bound work needs concurrency; CPU-bound work needs parallelism.
- Threads share memory: protect check-then-act sequences with a `Lock`, coordinate with `Event`
  and `Queue`, and never depend on scheduling order.
- The standard build's GIL runs one thread's Python code at a time; the free-threaded build
  removes it at some single-thread cost.
- Processes run in parallel but need picklable data and a `__main__` guard.
- `concurrent.futures` offers the same `map`/`submit` API for thread and process pools.

## Further reading

- [threading: thread-based parallelism](https://docs.python.org/3.15/library/threading.html)
- [concurrent.futures: launching parallel tasks](https://docs.python.org/3.15/library/concurrent.futures.html)
- [multiprocessing: process-based parallelism](https://docs.python.org/3.15/library/multiprocessing.html)
- [Python support for free threading](https://docs.python.org/3.15/howto/free-threading-python.html)
