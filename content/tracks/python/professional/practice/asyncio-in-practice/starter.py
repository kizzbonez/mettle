"""Ask every bike-share station how many bikes it has free, a few at a time."""
import asyncio


async def check_station(name, fetch, limit, seconds):
    """Return await fetch(name), "timed out" or "error: MESSAGE", holding a permit of LIMIT."""
    # YOUR CODE: async with limit, then a try around async with asyncio.timeout(seconds).
    raise NotImplementedError


async def check_all(stations, fetch, limit, seconds):
    """Check every station at most LIMIT at a time; return {name: result} in station order."""
    # YOUR CODE: one Semaphore, one TaskGroup, one task per station.
    raise NotImplementedError
