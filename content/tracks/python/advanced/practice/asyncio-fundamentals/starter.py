# The morning register: ask every classroom at once with asyncio.
import asyncio


async def ask(room, report, limit):
    # await report(room) within asyncio.timeout(limit).
    # "no answer" on a timeout, "offline" on ConnectionError; other errors carry on.
    raise NotImplementedError("write ask")


async def register(rooms, report, limit):
    # Ask every room at the same time (TaskGroup or gather) and return
    # {room: answer} with the keys in the order of rooms.
    raise NotImplementedError("write register")
