# The Tuesday evening example from the instructions.
import asyncio

jobs = [
    PrintJob(2, "bracket", 40),
    PrintJob(1, "gear", 120),
    PrintJob(3, "vase", 300),
    PrintJob(1, "hinge", 25),
]
board = JobBoard(jobs)
assert len(board) == 4, f"len(board) should be 4, got {len(board)}"
order = [job.job_id for job in board]
assert order == ["gear", "hinge", "bracket", "vase"], f"the board should iterate by priority, then id; got {order}"
assert "vase" in board, '"vase" in board should be True'
assert 42 not in board, "42 in board should be False"
assert board["hinge"] == PrintJob(1, "hinge", 25), f'board["hinge"] gave {board["hinge"]!r}'
assert repr(board) == "JobBoard(4 jobs)", f"repr(board) gave {repr(board)!r}"

printers = [Printer("prusa"), Printer("bambu")]
starts = asyncio.run(print_all(board, printers))
assert isinstance(starts, list) and len(starts) == 4, f"print_all should return a list of 4 tuples, got {starts!r}"
assert [job_id for job_id, _ in starts] == order, f"jobs should start in board order; got {starts}"
by_name = {printer.name: printer for printer in printers}
for job_id, name in starts:
    assert name in by_name, f"{name!r} in the result is not one of the printers"
    assert job_id in by_name[name].history, f"{job_id!r} is listed for {name!r} but is not in its history"
assert sorted(printers[0].history + printers[1].history) == sorted(order), (
    f"together the histories should hold each job once; got {printers[0].history} and {printers[1].history}"
)
assert all(printer.history for printer in printers), "both printers should have printed something"
assert all(printer.current is None for printer in printers), "every printer should be idle at the end"
assert len(board) == 4, "print_all should not remove jobs from the board"
print("Tuesday evening printed:", starts)
