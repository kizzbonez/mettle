Write `solution.py`. The starter names every class and function the tests use; keep those
names and parameters. You may add helper functions and private attributes. Use only the standard
library.

**1. `PrintJob`**, a frozen, ordered dataclass: `@dataclass(frozen=True, order=True)` with
exactly these fields, in this order:

| Field | Type | Rule |
| --- | --- | --- |
| `priority` | `int` | from 1 (most urgent) to 5 |
| `job_id` | `str` | contains at least one character that is not a space |
| `grams` | `int` | greater than 0 |

In `__post_init__`, raise `ValueError` when a field breaks its rule, including when it has the
wrong type (`2.5` is not a valid priority or weight, and `"3"` is not a valid priority).
Because the dataclass is ordered, sorting jobs puts them by priority, then by `job_id`.
Because it is frozen, jobs are hashable and assigning to a field raises
`dataclasses.FrozenInstanceError`.

**2. `JobBoard`**, the board of waiting jobs. Job ids are unique on a board.

- `JobBoard(jobs=())` creates a board and adds each job of the iterable with `add`.
- `add(job)` adds a job. Raise `TypeError` if `job` is not a `PrintJob`, and `ValueError` if a
  job with the same `job_id` is already on the board. A refused job changes nothing.
- `len(board)` is the number of jobs; an empty board is therefore false.
- Iterating over the board gives the jobs **sorted** (by priority, then id), whatever order
  they were added in. Each iteration starts from the beginning.
- `x in board` is `True` when `x` is a `PrintJob` equal to a job on the board, or a `str` equal
  to the id of a job on the board. Anything else gives `False`, never an error.
- `board[job_id]` returns the job with that id, and raises `KeyError` if there is none.
- `repr(board)` is `JobBoard(4 jobs)`, with `job` for exactly one job: `JobBoard(1 job)`,
  `JobBoard(0 jobs)`.

**3. `Printer`**. The starter's `__init__` sets `name`, `current` (the id of the job being
printed, or `None` when idle) and `history` (a list of the ids of the jobs printed
successfully, in order). Write `running(job)`, which returns a context manager:

- On entry: if the printer is busy (`current` is not `None`), raise `RuntimeError` and change
  nothing. Otherwise set `current` to `job.job_id`. The `as` target receives the job.
- When the block ends normally: append `job.job_id` to `history` and set `current` to `None`.
- When the block raises: set `current` to `None`, leave `history` unchanged, and let the
  exception propagate (do not suppress it).

**4. `async def print_all(board, printers)`** runs the night's printing and returns a list of
`(job_id, printer_name)` tuples, one per job, in the order the jobs **started**.

- Raise `ValueError` before printing anything if `printers` is empty or if any printer is busy.
- Start the jobs in the board's iteration order: put them on an `asyncio.Queue` in that order.
- Run one worker task per printer, all inside an `asyncio.TaskGroup`. A worker repeatedly takes
  the next job and prints it on its printer, and stops when no job is left.
- To print a job, enter `printer.running(job)`; inside the `with` block, first append
  `(job.job_id, printer.name)` to the result list, then `await asyncio.sleep(0)` once. The
  printer stays reserved during that pause, so the other printers start their jobs meanwhile.
- When `print_all` returns, every job has been printed exactly once and every printer is idle.
  The board itself is not changed. An empty board returns `[]`.

Example, a Tuesday evening with four jobs and two printers:

```python
jobs = [
    PrintJob(2, "bracket", 40),
    PrintJob(1, "gear", 120),
    PrintJob(3, "vase", 300),
    PrintJob(1, "hinge", 25),
]
board = JobBoard(jobs)
len(board)                       # 4
[job.job_id for job in board]    # ['gear', 'hinge', 'bracket', 'vase']
"vase" in board, 42 in board     # (True, False)
board["hinge"]                   # PrintJob(priority=1, job_id='hinge', grams=25)
repr(board)                      # 'JobBoard(4 jobs)'

printers = [Printer("prusa"), Printer("bambu")]
starts = asyncio.run(print_all(board, printers))
# [('gear', 'prusa'), ('hinge', 'bambu'), ('bracket', 'prusa'), ('vase', 'bambu')]
printers[0].history              # ['gear', 'bracket']
printers[1].current              # None
```

Which printer takes which job depends on how the workers are scheduled, so the tests never check
it. They check the order of the job ids in the result, that every job was printed exactly once
by the printer named next to it, that the printers really worked at the same time, and that all
of them are idle at the end.

**Tips.** Lesson 3 covers `__post_init__`, lesson 2 the container methods and lesson 4
`contextlib.contextmanager` with `try`/`finally`. In lesson 10, the kitchen example stops its
workers with `queue.join()` and `tg.cancel()`; `queue.get_nowait()`, which raises
`asyncio.QueueEmpty` when the queue is empty, is another way.
