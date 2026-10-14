# ConnectionError becomes a result; any other exception cancels the rest and arrives in an ExceptionGroup.
import asyncio


async def flaky(name):
    await asyncio.sleep(0)
    if name.startswith("down"):
        raise ConnectionError(f"station {name} ☂ unreachable")
    return 5


result = asyncio.run(check_all(["down-a", "up", "down-b"], flaky, limit=2, seconds=1))
expected = {"down-a": "error: station down-a ☂ unreachable", "up": 5, "down-b": "error: station down-b ☂ unreachable"}
assert result == expected, f"each ConnectionError should become 'error: MESSAGE' while the others carry on; got {result}"

cleaned_up = []


async def broken(name):
    await asyncio.sleep(0)
    if name == "bug":
        raise ValueError("bad reply from bug")
    try:
        await asyncio.Event().wait()   # never answers
    finally:
        cleaned_up.append(name)


try:
    asyncio.run(check_all(["slow-1", "bug", "slow-2"], broken, limit=3, seconds=0.5))
except ExceptionGroup as group:
    matched = group.subgroup(ValueError)
    assert matched is not None, f"the ExceptionGroup should contain the ValueError; it held {group.exceptions!r}"
except ValueError:
    raise AssertionError("the ValueError should arrive inside an ExceptionGroup, as a TaskGroup raises it") from None
else:
    raise AssertionError("an exception other than ConnectionError should not be caught: check_all should raise")
assert sorted(cleaned_up) == ["slow-1", "slow-2"], (
    "when one check fails with another exception, the TaskGroup should cancel the other checks"
)
