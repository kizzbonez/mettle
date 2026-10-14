Write two coroutine functions (`async def`) in `solution.py`. `report` is a coroutine function
supplied by the caller: `await report(room)` returns that room's answer.

1. `ask(room, report, limit)` awaits `report(room)` and returns its result, with these
   exceptions:
   - if it takes longer than `limit` seconds, return the string `"no answer"` (use
     `asyncio.timeout`);
   - if it raises `ConnectionError` (or a subclass), return the string `"offline"`;
   - any other exception carries on to the caller.
2. `register(rooms, report, limit)` asks **every room at the same time** (create tasks, with an
   `asyncio.TaskGroup` or `asyncio.gather`), each with its own `limit`, and returns a dict from
   room to answer whose keys are **in the order of `rooms`**, whatever order the answers came in.
   An empty list gives `{}`. When it returns, none of its tasks is still running.

The tests never measure time. They check that the rooms really are asked at the same time with
rooms that wait for each other's `asyncio.Event`: asked one after another, the first would time
out.

Example:

```python
import asyncio


async def report(room):
    await asyncio.sleep(0)
    if room == "lab":
        raise ConnectionError("tablet flat")
    if room == "gym":
        await asyncio.Event().wait()   # never answers
    return f"{room}: 24 present"


asyncio.run(ask("7A", report, 0.05))   # '7A: 24 present'
asyncio.run(register(["7A", "lab", "gym", "7B"], report, 0.05))
# {'7A': '7A: 24 present', 'lab': 'offline', 'gym': 'no answer', '7B': '7B: 24 present'}
```
