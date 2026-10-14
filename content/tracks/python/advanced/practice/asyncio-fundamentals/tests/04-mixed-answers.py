# register: a silent or flat tablet affects only its own room, and every room is asked once.
import asyncio

calls = []


async def report(room):
    calls.append(room)
    await asyncio.sleep(0)
    if room.startswith("silent"):
        await asyncio.Event().wait()
    if room.startswith("flat"):
        raise ConnectionResetError(f"{room} lost power")
    return f"{room}: {len(room)} pupils"


rooms = ["silent 1", "Año 4", "flat 2", "5B", "silent 2"]
answers = asyncio.run(register(rooms, report, 0.2))
assert answers == {
    "silent 1": "no answer",
    "Año 4": "Año 4: 5 pupils",
    "flat 2": "offline",
    "5B": "5B: 2 pupils",
    "silent 2": "no answer",
}, f"each room gets its own answer, timeout or 'offline'; got {answers!r}"
assert list(answers) == rooms, "the keys are in the order of the rooms"
assert sorted(calls) == sorted(rooms), "each room is asked exactly once"

only_silent = asyncio.run(register(["silent A"], report, 0.2))
assert only_silent == {"silent A": "no answer"}, "a single silent room gives 'no answer'"
