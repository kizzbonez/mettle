Write three pieces in `solution.py`: threads that run together, a lock around shared state,
and a process pool.

1. `run_together(jobs)`: `jobs` is a list of functions that take no arguments. Start **one
   thread per job** so that they all run at the same time, wait until every thread has finished,
   and return the jobs' return values **in the order of `jobs`**, not the order they finished in.
   An empty list gives `[]`. (A thread cannot return a value, so each one stores its result.)
2. `CarPark`. The starter's `__init__` sets `free` (the number of free spaces), `parked` (the
   plates of the parked cars, in the order they entered) and `lock`, a `threading.Lock`. Hold
   `self.lock` for the **whole** of each method; the tests hold the lock themselves and check
   that your method waits for it.
   - `enter(plate)`: if a space is free, take it (one less free space, `plate` added to
     `parked`) and return `True`; otherwise return `False`.
   - `leave(plate)`: remove `plate` from `parked` and free its space. If `plate` is not parked,
     raise `ValueError` and change nothing.
3. `checksums(texts)` returns `[checksum(text) for text in texts]`, but computed in a
   `ProcessPoolExecutor(max_workers=2)` with `pool.map`. The starter's `checksum` is ready; pass
   that function itself to the pool, because a lambda cannot be sent to another process. The
   tests check that the work really ran in other processes. If you try the example at the
   bottom of `solution.py`, put it under `if __name__ == "__main__":`, since each worker
   process imports `solution.py`.

Example:

```python
import threading

a_ready, b_ready = threading.Event(), threading.Event()


def gate_a():
    a_ready.set()
    return "A saw B" if b_ready.wait(2) else "A was alone"


def gate_b():
    b_ready.set()
    return "B saw A" if a_ready.wait(2) else "B was alone"


run_together([gate_a, gate_b])           # ['A saw B', 'B saw A']: both ran at the same time

park = CarPark(2)
[park.enter(p) for p in ["KL 1", "KL 2", "KL 3"]]   # [True, True, False]
park.leave("KL 1")
park.free, park.parked                   # (1, ['KL 2'])
park.leave("XX 9")                       # ValueError

checksums(["abc", "", "Zoë"])            # [590, 0, 1017]
```
