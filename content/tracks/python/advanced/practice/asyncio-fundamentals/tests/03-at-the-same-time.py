# register: asks all rooms at the same time and keeps the rooms' order, whatever finishes first.
import asyncio


async def everyone_present():
    """Each room answers only after every room has been asked: impossible one at a time."""
    rooms = ["1A", "1B", "2A"]
    asked = {room: asyncio.Event() for room in rooms}

    async def report(room):
        asked[room].set()
        for event in asked.values():
            await event.wait()
        return "present"

    answers = await register(rooms, report, 1)
    leftover = asyncio.all_tasks() - {asyncio.current_task()}
    return answers, leftover


answers, leftover = asyncio.run(everyone_present())
assert answers == {room: "present" for room in ["1A", "1B", "2A"]}, "all rooms should be asked at the same time, so none times out"
assert not leftover, "no task of register is still running when it returns"


async def last_room_first():
    rooms = ["R1", "R2", "R3", "R4"]
    finished = []

    async def report(room):
        for _ in range(10 - 2 * rooms.index(room)):
            await asyncio.sleep(0)
        finished.append(room)
        return f"{room} done"

    answers = await register(rooms, report, 1)
    return answers, finished


answers, finished = asyncio.run(last_room_first())
assert finished == ["R4", "R3", "R2", "R1"], "the rooms should be asked at the same time, so the quickest finishes first"
assert list(answers) == ["R1", "R2", "R3", "R4"], "the keys follow the order of rooms, not the order the answers came in"
assert answers["R3"] == "R3 done", "each room gets its own answer"

assert asyncio.run(register([], None, 1)) == {}, "no rooms give an empty dict"
