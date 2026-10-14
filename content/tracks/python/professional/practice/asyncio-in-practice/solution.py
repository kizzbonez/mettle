"""Ask every bike-share station how many bikes it has free, a few at a time."""
import asyncio


async def check_station(name, fetch, limit, seconds):
    """Return await fetch(name), "timed out" or "error: MESSAGE", holding a permit of LIMIT."""
    async with limit:
        try:
            async with asyncio.timeout(seconds):
                return await fetch(name)
        except TimeoutError:
            return "timed out"
        except ConnectionError as error:
            return f"error: {error}"


async def check_all(stations, fetch, limit, seconds):
    """Check every station at most LIMIT at a time; return {name: result} in station order."""
    semaphore = asyncio.Semaphore(limit)
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(check_station(name, fetch, semaphore, seconds)) for name in stations]
    return {name: task.result() for name, task in zip(stations, tasks)}
