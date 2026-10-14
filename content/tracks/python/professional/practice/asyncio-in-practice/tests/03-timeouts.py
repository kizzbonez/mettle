# Each fetch has its own deadline: stations that never answer time out and are cancelled, the rest answer.
import asyncio

cancelled = []


async def fetch(name):
    await asyncio.sleep(0)
    if name.startswith("dead"):
        try:
            await asyncio.Event().wait()   # never answers
        finally:
            cancelled.append(name)
    return len(name)


stations = ["dead-1", "ok", "dead-2", "quay", "zoo"]
result = asyncio.run(check_all(stations, fetch, limit=5, seconds=0.05))
expected = {"dead-1": "timed out", "ok": 2, "dead-2": "timed out", "quay": 4, "zoo": 3}
assert result == expected, f"two stations that never answer should each time out on their own deadline; got {result}"
assert sorted(cancelled) == ["dead-1", "dead-2"], "a fetch that runs out of time should be cancelled"

cancelled.clear()
result = asyncio.run(check_all(["dead-only"], fetch, limit=1, seconds=0.05))
assert result == {"dead-only": "timed out"}, f"a single station that never answers: got {result}"

result = asyncio.run(check_all(["a", "bb", "ccc"], fetch, limit=1, seconds=0.05))
assert result == {"a": 1, "bb": 2, "ccc": 3}, f"stations that answer at once should never time out; got {result}"
