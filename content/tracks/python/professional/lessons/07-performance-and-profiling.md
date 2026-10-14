---
title: Performance and Profiling
summary: Make Python code faster the reliable way. Measure with timeit, find the hot spots with the deterministic profiler and the new sampling profiler of Python 3.15, fix them with the right data structure, a cache or a generator, and know where the experimental JIT stands.
minutes: 35
objectives:
  - Time small snippets correctly with timeit and read its results
  - Profile a program with profiling.tracing (cProfile) and profiling.sampling, and read their tables
  - Use the time complexity of list, dict, set and deque operations to pick a data structure
  - Speed up repeated work with functools caches, and save memory with generators
---

## Outline

1. Measure before you optimise
2. Timing snippets with `timeit`
3. Profiling a whole program
4. The cost of built-in operations
5. Caching
6. Generators for memory
7. The JIT and other levers

## Measure before you optimise

Programs are usually slow in one or two places, and they are rarely the places you would guess.
Work in this order: make the code **correct** (with tests, lesson 2), **measure** to find where the
time goes, fix the **algorithm** or **data structure** there, then measure again to prove the
change helped. Micro-tweaks such as caching a method in a local variable come last, if ever.

## Timing snippets with `timeit`

`time.perf_counter()` around a call is fine for whole seconds. For small snippets, single
measurements are dominated by noise. `timeit` runs a statement many times, repeats the
measurement, and switches off garbage collection while timing:

```python
import timeit

setup = "names = [f'user{n}' for n in range(10_000)]; name_set = set(names)"
for label, statement in [("list", "'user9999' in names"), ("set", "'user9999' in name_set")]:
    best = min(timeit.repeat(statement, setup=setup, repeat=5, number=1_000))
    print(f"{label}: {best / 1_000 * 1e6:.3f} µs per lookup")
```

```text
list: 116.308 µs per lookup
set: 0.022 µs per lookup
```

Take the **minimum** of the repeats: the documentation explains that higher values come from
other processes interfering, not from Python. The command line picks the loop count for you.
Here it compares a list used as a queue with `collections.deque`, a double-ended queue built
for adding and removing at both ends:

```console
$ python -m timeit -s "from collections import deque; q = deque(range(10_000))" "q.append(q.popleft())"
10000000 loops, best of 5: 37 nsec per loop
$ python -m timeit -s "q = list(range(10_000))" "q.append(q.pop(0))"
200000 loops, best of 5: 1.25 usec per loop
```

Your numbers will differ by machine; compare the ratio, not the values.

## Profiling a whole program

A **profiler** reports where a running program spends its time. Python 3.15 groups the profilers
in a new `profiling` package (PEP 799):

- **`profiling.tracing`**, a **deterministic** profiler, records every function call and return.
  It gives exact call counts but slows the program down. It is the old `cProfile`, which remains
  as an alias, so `python -m cProfile` still works. The pure-Python `profile` module is deprecated.
- **`profiling.sampling`**, new in 3.15, is a **statistical** profiler. It looks at the program's
  stack thousands of times a second from outside and counts where it finds it. The overhead is
  close to zero, it reports lines as well as functions, and it can even attach to a running
  process by its ID.

Here is a program that removes duplicates from 40,000 words:

```python
def load_words(count):
    return [f"word{n % 5000}" for n in range(count)]


def unique_slow(words):
    seen = []
    for word in words:
        if word not in seen:
            seen.append(word)
    return seen


def unique_fast(words):
    return list(dict.fromkeys(words))


def main():
    words = load_words(40_000)
    slow = unique_slow(words)
    fast = unique_fast(words)
    print(len(slow), len(fast), slow == fast)


if __name__ == "__main__":
    main()
```

```console
$ python -m profiling.tracing -s tottime slow.py
5000 5000 True
         5011 function calls in 2.397 seconds

   Ordered by: internal time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    2.376    2.376    2.379    2.379 slow.py:5(unique_slow)
        1    0.011    0.011    0.011    0.011 slow.py:1(load_words)
        1    0.005    0.005    0.005    0.005 {built-in method fromkeys}
     5000    0.003    0.000    0.003    0.000 {method 'append' of 'list' objects}
$ python -m profiling.sampling run --no-summary -l 3 slow.py
5000 5000 True
Captured 2018 samples in 2.02 seconds
Sample rate: 999.99 samples/sec
Error rate: 0.94
Profile Stats:
       nsamples   sample%   tottime (s)    cumul%   cumtime (s)  filename:lineno(function)
      1984/1984      99.2         1.984      99.2         1.984  slow.py:8(unique_slow)
            6/6       0.3         0.006       0.3         0.006  slow.py:9(unique_slow)
            4/4       0.2         0.004       0.2         0.004  slow.py:7(unique_slow)
```

(Both outputs are shortened.) **tottime** is time spent in the function itself; **cumtime**
includes the functions it called. Sort by `tottime` to find the code that does the work, by
`cumtime` to find the caller that started it. Both profilers agree: nearly all the time is in
`unique_slow`, and the sampling profiler pins it to line 8, `if word not in seen:`. `unique_fast` gives
the same result in about a five-hundredth of the time. `-o FILE` saves results; `--flamegraph` draws an
interactive HTML chart.

## The cost of built-in operations

Line 8 is slow because `in` on a list compares the word with every item: its cost grows with the
list's length, written **O(n)**. On a set or dict it hashes the word and looks in one place:
**O(1)** on average. Average costs from the Python wiki:

| Operation | list | deque | dict / set |
| --- | --- | --- | --- |
| `x in c` | O(n) | O(n) | O(1) |
| index `c[i]` / key `d[k]` | O(1) | O(n) in the middle | O(1) |
| add at the end | O(1) | O(1) | O(1) |
| remove at the front | O(n) | O(1) | |
| insert or delete in the middle | O(n) | O(n) | O(1) by key |

So: membership tests and lookups by key belong in a `set` or `dict`, queues in
`collections.deque`, and sorting once (O(n log n)) beats searching a list again and again.
`unique_slow` called an O(n) test n times, which is O(n²); `dict.fromkeys` is O(n) and keeps the
first-seen order.

## Caching

If a function is pure (same arguments, same result, no side effects) and called repeatedly with
the same arguments, remember the results. `functools.lru_cache` (advanced level) does it in one
line:

```python
import sys
import time
from functools import lru_cache


@lru_cache(maxsize=1024)
def route_minutes(origin, destination):
    time.sleep(0.01)                       # stands for a slow calculation
    return (len(origin) * 7 + len(destination) * 3) % 60 + 10


deliveries = [("depot", "harbour"), ("depot", "station"), ("depot", "harbour")] * 100
start = time.perf_counter()
total = sum(route_minutes(origin, destination) for origin, destination in deliveries)
print(total, f"{time.perf_counter() - start:.2f} s")
print(route_minutes.cache_info())

squares_list = [n * n for n in range(1_000_000)]
squares_gen = (n * n for n in range(1_000_000))
print(sys.getsizeof(squares_list), sys.getsizeof(squares_gen))
print(sum(squares_list) == sum(squares_gen))
```

```text
19800 0.02 s
CacheInfo(hits=298, misses=2, maxsize=1024, currsize=2)
8448728 216
True
```

300 calls cost two real calculations. `cache_info()` shows whether a cache earns its memory. The
arguments must be hashable, and a cache on a function whose answer can change (prices, files)
returns stale data until you call `cache_clear()`.

## Generators for memory

The last lines of the example compare a list of a million squares with a generator expression
that produces them one at a time. The list's array of references alone is about 8 MB (lesson 8
explains what `sys.getsizeof` leaves out); the generator is 216 bytes whatever its length. When
you only loop over values once, as `sum` does, a generator keeps memory flat. Its limit: it can
be consumed only once.

## The JIT and other levers

CPython 3.13 added an **experimental JIT** (just-in-time compiler) that turns hot bytecode into
machine code. Since 3.14 the official Windows and macOS installers include it, off by default and
enabled for testing with the environment variable `PYTHON_JIT=1`; it is not recommended for
production. Python 3.15's What's New reports a 7 to 8 percent average speed-up on x86-64 Linux.
Many Linux builds, including the lab sandbox, are built without it:
`sys._jit.is_available()` returns `False` there.

Bigger wins usually come from elsewhere: a better algorithm, moving numeric loops into NumPy
(available in the sandbox), processes for CPU-bound work (advanced level), or the free-threaded
build for threads that compute in parallel.

## Common mistakes

- **Optimising without a profile.** You speed up `load_words` by half and the program is 0.2 %
  faster.
- **Timing once.** A single `perf_counter` measurement of a microsecond operation is noise; use
  `timeit` and the minimum.
- **Profiling the first run only.** Imports and caches warming up dominate; profile a realistic
  workload.
- **`lru_cache` on a method.** The cache holds `self`, keeping every instance alive. Cache a plain
  function, or use `functools.cached_property` for per-instance values.
- **Rewriting `x in my_list` as a loop "for speed".** Built-ins run in C; change the data structure
  instead.

## Practice

1. Rewrite `unique_slow` with a set for `seen` while keeping the order of first appearance.
2. A queue of jobs uses `jobs.pop(0)`. Which type and method replace it, and why?
3. Which profiler would you use on a server process you cannot restart?

### Answers

1. ```python
   def unique_set(words):
       seen = set()
       result = []
       for word in words:
           if word not in seen:
               seen.add(word)
               result.append(word)
       return result
   ```
   The membership test is now O(1), so the function is O(n).
2. `collections.deque` with `popleft()`. `list.pop(0)` shifts every remaining item, O(n); a deque
   removes from either end in O(1), as the timing above showed (37 ns against 1.25 µs).
3. `python -m profiling.sampling attach PID`: it reads the running process from outside, with
   almost no overhead. Attaching needs permission to read the other process's memory.

## Key takeaways

- Correct first, then measure, then fix the algorithm, then measure again.
- `timeit` with the minimum of several repeats for snippets; profilers for whole programs.
- 3.15's `profiling.tracing` (alias `cProfile`) counts every call; `profiling.sampling` samples cheaply, line by line.
- `in` on a list is O(n), on a set or dict O(1); queues are `deque`s.
- Cache pure, repeated calls; use generators for single-pass data; the JIT is experimental.

## Further reading

- [profiling: Python profilers (3.15)](https://docs.python.org/3.15/library/profiling.html)
- [profiling.sampling: Statistical profiler](https://docs.python.org/3.15/library/profiling.sampling.html)
- [timeit: Measure execution time of small code snippets](https://docs.python.org/3.15/library/timeit.html)
- [Python wiki: TimeComplexity](https://wiki.python.org/moin/TimeComplexity)
