# The morning register: ask every classroom at once with asyncio.
import asyncio


async def ask(room, report, limit):
    try:
        async with asyncio.timeout(limit):
            return await report(room)
    except TimeoutError:
        return "no answer"
    except ConnectionError:
        return "offline"


async def register(rooms, report, limit):
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(ask(room, report, limit)) for room in rooms]
    return {room: task.result() for room, task in zip(rooms, tasks)}
