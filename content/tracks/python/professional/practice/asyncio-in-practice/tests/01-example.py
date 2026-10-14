# The example from the instructions, and no more than two fetches at once.
import asyncio

running = 0
peak = 0


async def fetch(name):
    global running, peak
    running += 1
    peak = max(peak, running)
    try:
        await asyncio.sleep(0)
        if name == "harbour":
            raise ConnectionError("no answer")
        if name == "museum":
            await asyncio.Event().wait()   # never answers
        return {"north": 7, "park": 0}[name]
    finally:
        running -= 1


result = asyncio.run(check_all(["north", "harbour", "museum", "park"], fetch, limit=2, seconds=0.1))
expected = {"north": 7, "harbour": "error: no answer", "museum": "timed out", "park": 0}
assert result == expected, f"check_all for the example should return {expected}, not {result}"
assert list(result) == ["north", "harbour", "museum", "park"], "the result should list the stations in the order given"
assert peak <= 2, f"with limit=2 no more than 2 fetches may run at once, but {peak} did"
