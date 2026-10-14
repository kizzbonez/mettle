# The semaphore: exactly `limit` fetches at once, all of them when the limit allows; order and no stations.
import asyncio

running = 0
peak = 0
finished = []


async def fetch(name):
    global running, peak
    running += 1
    peak = max(peak, running)
    try:
        # later stations answer sooner, so tasks finish in reverse order
        for _ in range(9 - int(name[1:])):
            await asyncio.sleep(0)
        finished.append(name)
        return int(name[1:]) * 10
    finally:
        running -= 1


stations = [f"s{n}" for n in range(1, 9)]


def run(limit):
    global running, peak
    running = peak = 0
    finished.clear()
    return asyncio.run(check_all(stations, fetch, limit=limit, seconds=5))


result = run(3)
assert result == {f"s{n}": n * 10 for n in range(1, 9)}, f"every station's fetch result should be returned, got {result}"
assert list(result) == stations, "the result should follow the order of stations, not the order the fetches finished in"
assert peak == 3, f"with limit=3 and 8 stations, exactly 3 fetches should run at once, not {peak}"

run(1)
assert peak == 1, f"with limit=1 the fetches should run one at a time, but {peak} ran at once"

run(20)
assert peak == 8, f"with a limit above the number of stations all 8 fetches should run at once, not {peak}"

assert asyncio.run(check_all([], fetch, limit=2, seconds=1)) == {}, "check_all with no stations should return {}"
