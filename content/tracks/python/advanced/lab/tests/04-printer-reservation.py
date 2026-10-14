# Printer.running reserves the printer and always releases it.
gear = PrintJob(1, "gear", 120)
hinge = PrintJob(1, "hinge", 25)
printer = Printer("prusa")

with printer.running(gear) as target:
    assert target == gear, "the as target of running(job) should be the job"
    assert printer.current == "gear", "while the block runs, current is the job id"
    assert printer.history == [], "a job is added to history only when its block has finished"
assert printer.current is None, "after the block the printer is idle"
assert printer.history == ["gear"], f"after the block the job is in history; got {printer.history}"

with printer.running(hinge):
    try:
        with printer.running(gear):
            pass
    except RuntimeError:
        pass
    else:
        raise AssertionError("reserving a busy printer should raise RuntimeError")
    assert printer.current == "hinge", "a refused reservation leaves the current job alone"
assert printer.history == ["gear", "hinge"], f"history keeps the order of finished jobs; got {printer.history}"


class Jam(Exception):
    pass


try:
    with printer.running(PrintJob(2, "vase", 300)):
        raise Jam("filament tangled")
except Jam:
    pass
else:
    raise AssertionError("an exception inside the block must propagate, not be suppressed")
assert printer.current is None, "a failed print still releases the printer"
assert printer.history == ["gear", "hinge"], "a failed print is not added to history"

with printer.running(PrintJob(2, "vase", 300)):
    pass
assert printer.history == ["gear", "hinge", "vase"], "the printer can be used again after a failure"

other = Printer("bambu")
assert other.current is None and other.history == [], "each printer has its own state"
