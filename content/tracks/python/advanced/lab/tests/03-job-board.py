# JobBoard behaves like a container and refuses bad jobs without changing.
empty = JobBoard()
assert len(empty) == 0 and not empty, "a new board without jobs has length 0 and is false"
assert list(empty) == [], "iterating over an empty board gives nothing"
assert repr(empty) == "JobBoard(0 jobs)", f"repr of an empty board gave {repr(empty)!r}"

board = JobBoard()
board.add(PrintJob(4, "vase", 300))
assert repr(board) == "JobBoard(1 job)", f"repr with one job gave {repr(board)!r}"
board.add(PrintJob(1, "gear", 120))
board.add(PrintJob(4, "bowl", 200))
board.add(PrintJob(2, "clip", 5))
assert len(board) == 4 and board, "the board counts the jobs added"
first = [job.job_id for job in board]
second = [job.job_id for job in board]
assert first == ["gear", "clip", "bowl", "vase"], f"iteration is sorted by priority, then id; got {first}"
assert second == first, "every iteration starts again from the beginning"

try:
    board.add(PrintJob(5, "gear", 1))
except ValueError:
    pass
else:
    raise AssertionError("adding a second job with an existing id should raise ValueError")
assert len(board) == 4 and board["gear"] == PrintJob(1, "gear", 120), "a refused duplicate changes nothing"

for not_a_job in ["gear", ("gear", 1), None]:
    try:
        board.add(not_a_job)
    except TypeError:
        continue
    except Exception as error:
        raise AssertionError(f"add({not_a_job!r}) should raise TypeError, not {type(error).__name__}")
    raise AssertionError(f"add({not_a_job!r}) should raise TypeError")
assert len(board) == 4, "refused additions leave the board unchanged"

assert "clip" in board and PrintJob(2, "clip", 5) in board, "membership works with an id and with an equal job"
assert "pin" not in board, "an unknown id is not on the board"
assert PrintJob(3, "clip", 5) not in board, "a job that differs from the one on the board is not in it"
for other in [42, None, ("clip",), ["clip"], 2.5]:
    try:
        found = other in board
    except Exception as error:
        raise AssertionError(f"{other!r} in board should be False, not raise {type(error).__name__}")
    assert found is False, f"{other!r} in board should be False"

assert board["bowl"] == PrintJob(4, "bowl", 200), "indexing by id returns the job"
try:
    board["pin"]
except KeyError:
    pass
else:
    raise AssertionError("indexing by an unknown id should raise KeyError")

from_list = JobBoard([PrintJob(3, "b", 1), PrintJob(3, "a", 1)])
assert [job.job_id for job in from_list] == ["a", "b"], "the constructor adds every job of the iterable"
from_generator = JobBoard(PrintJob(2, name, 10) for name in ["x", "y"])
assert len(from_generator) == 2, "the constructor accepts any iterable, such as a generator"
try:
    JobBoard([PrintJob(1, "a", 1), PrintJob(2, "a", 1)])
except ValueError:
    pass
else:
    raise AssertionError("the constructor refuses duplicate ids with ValueError, as add does")
