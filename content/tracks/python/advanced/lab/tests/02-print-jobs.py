# PrintJob: a frozen, ordered dataclass that validates its fields.
import dataclasses

assert dataclasses.is_dataclass(PrintJob), "PrintJob should be a dataclass"
names = [field.name for field in dataclasses.fields(PrintJob)]
assert names == ["priority", "job_id", "grams"], f"PrintJob's fields, in order, are {names}"

job = PrintJob(3, "gate-hinge", 25)
assert (job.priority, job.job_id, job.grams) == (3, "gate-hinge", 25), "a valid job keeps its values"
assert PrintJob(1, "x", 1) and PrintJob(5, "y", 1000), "priorities 1 and 5 and any weight above 0 are valid"

bad = [
    (0, "a", 10), (6, "a", 10), (2.5, "a", 10), ("3", "a", 10),
    (1, "", 10), (1, "   ", 10), (1, 7, 10),
    (1, "a", 0), (1, "a", -5), (1, "a", 2.5),
]
for args in bad:
    try:
        PrintJob(*args)
    except ValueError:
        continue
    except Exception as error:
        raise AssertionError(f"PrintJob{args} should raise ValueError, not {type(error).__name__}")
    raise AssertionError(f"PrintJob{args} should be refused with ValueError")

try:
    job.grams = 10
except AttributeError:
    pass
else:
    raise AssertionError("assigning to a field of a frozen job should raise FrozenInstanceError")
assert job.grams == 25, "a refused assignment leaves the job unchanged"

same = PrintJob(3, "gate-hinge", 25)
assert job == same and hash(job) == hash(same), "equal jobs compare equal and hash equally"
assert len({job, same, PrintJob(3, "gate-hinge", 26)}) == 2, "jobs work as set members"

shuffled = [PrintJob(2, "b", 5), PrintJob(1, "z", 5), PrintJob(3, "a", 5), PrintJob(1, "c", 5)]
ids = [j.job_id for j in sorted(shuffled)]
assert ids == ["c", "z", "b", "a"], f"jobs sort by priority, then by id; got {ids}"
assert PrintJob(1, "z", 5) < PrintJob(2, "a", 5), "a lower priority number sorts first"
