Write one coroutine, `check_all(stations, fetch, limit, seconds)`, in `solution.py` (a helper
coroutine for one station is a good idea). `stations` is a list of distinct station names and
`fetch` is a coroutine function: `await fetch(name)` returns that station's number of free bikes.

1. Check every station in its own task, all inside one `asyncio.TaskGroup`, and return a `dict`
   from station name to its result, in the order of `stations`. No stations gives `{}`.
2. Never run more than `limit` fetches at the same time: share one `asyncio.Semaphore(limit)`
   between the tasks.
3. Give each fetch its own deadline of `seconds` with `asyncio.timeout(seconds)`. When it runs
   out, that station's result is the string `"timed out"`.
4. When `fetch` raises `ConnectionError`, the station's result is `"error: "` followed by the
   exception's message, and the other stations carry on.
5. Any other exception is not caught: the `TaskGroup` cancels the remaining checks and
   `check_all` raises an `ExceptionGroup` that contains it. Do not use `except Exception`.

**How it is judged.** The tests pass in fake `fetch` coroutines. They count how many fetches run
at once by yielding with `await asyncio.sleep(0)`, make a station hang forever by waiting on an
`asyncio.Event` that is never set, and check results, never timings.

**Example.**

```python
async def fetch(name):
    await asyncio.sleep(0)
    if name == "harbour":
        raise ConnectionError("no answer")
    if name == "museum":
        await asyncio.Event().wait()   # never answers
    return {"north": 7, "park": 0}[name]


asyncio.run(check_all(["north", "harbour", "museum", "park"], fetch, limit=2, seconds=0.1))
# {'north': 7, 'harbour': 'error: no answer', 'museum': 'timed out', 'park': 0}
```

The museum's fetch is cancelled after 0.1 s. While it waits it holds one of the two permits, so
the other stations take turns with the second one.

**Tip.** Put `async with limit:` around the `try`, and `async with asyncio.timeout(seconds):`
inside it, around the `await fetch(name)` only. Catch `TimeoutError` and `ConnectionError` with
two `except` clauses.
