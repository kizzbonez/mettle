# The register example from the instructions.
import asyncio
import inspect

assert inspect.iscoroutinefunction(ask), "ask should be defined with async def"
assert inspect.iscoroutinefunction(register), "register should be defined with async def"


async def report(room):
    await asyncio.sleep(0)
    if room == "lab":
        raise ConnectionError("tablet flat")
    if room == "gym":
        await asyncio.Event().wait()
    return f"{room}: 24 present"


assert asyncio.run(ask("7A", report, 0.05)) == "7A: 24 present", "ask returns what report returns"
answers = asyncio.run(register(["7A", "lab", "gym", "7B"], report, 0.05))
assert answers == {"7A": "7A: 24 present", "lab": "offline", "gym": "no answer", "7B": "7B: 24 present"}, f"register maps each room to its answer; got {answers!r}"
assert list(answers) == ["7A", "lab", "gym", "7B"], "the keys are in the order of the rooms"
