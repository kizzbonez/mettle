# ask: returns the answer, "no answer" after the limit, "offline" for connection errors.
import asyncio

asked = []


async def report(room):
    asked.append(room)
    for _ in range(3):
        await asyncio.sleep(0)
    match room:
        case "silent":
            await asyncio.Event().wait()
        case "flat":
            raise ConnectionError("battery flat")
        case "refused":
            raise ConnectionRefusedError("tablet refused")
        case "broken":
            raise ValueError("register corrupted")
        case "empty":
            return 0
        case "dict":
            return {"present": 21, "absent": 3}
    return f"{room} ok"


assert asyncio.run(ask("3C", report, 1)) == "3C ok", "ask returns the answer of report"
assert asked == ["3C"], "ask calls report once, with the room"
assert asyncio.run(ask("empty", report, 1)) == 0, "a falsy answer such as 0 is returned as it is"
assert asyncio.run(ask("dict", report, 1)) == {"present": 21, "absent": 3}, "an answer of any type is returned as it is"


async def ask_silent_room():
    """Asks a room that never answers; the test itself gives up after 2 seconds."""
    try:
        async with asyncio.timeout(2):
            return await ask("silent", report, 0.05)
    except TimeoutError:
        return "the test gave up waiting"


assert asyncio.run(ask_silent_room()) == "no answer", "a report that never finishes gives 'no answer' after the limit"
assert asyncio.run(ask("flat", report, 1)) == "offline", "ConnectionError gives 'offline'"
assert asyncio.run(ask("refused", report, 1)) == "offline", "a subclass of ConnectionError also gives 'offline'"

try:
    asyncio.run(ask("broken", report, 1))
except ValueError:
    pass
except Exception as error:
    raise AssertionError(f"another exception should reach the caller unchanged, not as {type(error).__name__}")
else:
    raise AssertionError("an exception other than ConnectionError should reach the caller")
