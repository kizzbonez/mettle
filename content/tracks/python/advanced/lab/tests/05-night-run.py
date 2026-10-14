# print_all: every job once, in board order, on printers that really work at the same time.
import asyncio
import inspect

assert inspect.iscoroutinefunction(print_all), "print_all should be defined with async def"

specs = [(3, "lamp", 90), (1, "gear", 120), (5, "bust", 400), (2, "clip", 5),
         (1, "hinge", 25), (4, "bowl", 200), (2, "knob", 30)]
board = JobBoard(PrintJob(*spec) for spec in specs)
expected = [job.job_id for job in board]
printers = [Printer("prusa"), Printer("bambu"), Printer("creality")]


async def run_and_watch():
    """Runs print_all while sampling how many printers are busy between its steps."""
    task = asyncio.create_task(print_all(board, printers))
    busiest = 0
    while not task.done():
        busiest = max(busiest, sum(printer.current is not None for printer in printers))
        await asyncio.sleep(0)
    return await task, busiest


starts, busiest = asyncio.run(run_and_watch())
assert [job_id for job_id, _ in starts] == expected, f"jobs should start in board order; got {starts}"
names = {printer.name: printer for printer in printers}
for job_id, name in starts:
    assert name in names and job_id in names[name].history, f"{job_id!r} should be in the history of {name!r}"
all_printed = sorted(job_id for printer in printers for job_id in printer.history)
assert all_printed == sorted(expected), f"each job is printed exactly once; histories hold {all_printed}"
assert all(printer.history for printer in printers), "with more jobs than printers, every printer prints"
assert busiest >= 2, "printers should be reserved during the pause so that several print at the same time"
assert all(printer.current is None for printer in printers), "every printer is idle at the end"
assert len(board) == 7, "print_all does not change the board"

solo = Printer("solo")
assert [j for j, _ in asyncio.run(print_all(board, [solo]))] == expected, "one printer prints everything in order"
assert solo.history == expected, f"a single printer's history follows the board order; got {solo.history}"

spare = [Printer(f"p{n}") for n in range(4)]
few = JobBoard([PrintJob(2, "b", 1), PrintJob(1, "a", 1)])
result = asyncio.run(print_all(few, spare))
assert [j for j, _ in result] == ["a", "b"], f"more printers than jobs still prints each job once; got {result}"
assert sum(len(p.history) for p in spare) == 2, "only two jobs were printed in total"

idle = [Printer("x"), Printer("y")]
assert asyncio.run(print_all(JobBoard(), idle)) == [], "an empty board returns an empty list"
assert all(p.history == [] for p in idle), "an empty board prints nothing"

try:
    asyncio.run(print_all(board, []))
except Exception as error:
    caught = error
else:
    caught = None
assert isinstance(caught, ValueError), f"an empty printer list should make print_all raise ValueError, got {caught!r}"

first, second = Printer("first"), Printer("second")
with first.running(PrintJob(1, "stuck", 10)):
    try:
        asyncio.run(print_all(board, [first, second]))
    except Exception as error:
        caught = error
    else:
        caught = None
assert isinstance(caught, ValueError), f"a busy printer should make print_all raise ValueError, got {caught!r}"
assert second.history == [] and first.history == ["stuck"], "nothing is printed when a printer is busy"
