"""The Hollow Oak Makerspace print controller: jobs, the job board, printers and the night run."""

import asyncio
from contextlib import contextmanager
from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class PrintJob:
    """One print job. Jobs sort by priority (1 is most urgent), then by id."""

    priority: int
    job_id: str
    grams: int

    def __post_init__(self):
        if not isinstance(self.priority, int) or not 1 <= self.priority <= 5:
            raise ValueError(f"priority must be an int from 1 to 5, got {self.priority!r}")
        if not isinstance(self.job_id, str) or not self.job_id.strip():
            raise ValueError(f"job_id must be a non-blank string, got {self.job_id!r}")
        if not isinstance(self.grams, int) or self.grams <= 0:
            raise ValueError(f"grams must be an int above 0, got {self.grams!r}")


class JobBoard:
    """The jobs waiting to be printed, with unique ids."""

    def __init__(self, jobs=()):
        self._jobs = {}
        for job in jobs:
            self.add(job)

    def add(self, job):
        if not isinstance(job, PrintJob):
            raise TypeError(f"expected a PrintJob, got {type(job).__name__}")
        if job.job_id in self._jobs:
            raise ValueError(f"job {job.job_id!r} is already on the board")
        self._jobs[job.job_id] = job

    def __len__(self):
        return len(self._jobs)

    def __iter__(self):
        return iter(sorted(self._jobs.values()))

    def __contains__(self, item):
        if isinstance(item, PrintJob):
            return self._jobs.get(item.job_id) == item
        if isinstance(item, str):
            return item in self._jobs
        return False

    def __getitem__(self, job_id):
        return self._jobs[job_id]

    def __repr__(self):
        noun = "job" if len(self) == 1 else "jobs"
        return f"JobBoard({len(self)} {noun})"


class Printer:
    """A printer that prints one job at a time and remembers what it printed."""

    def __init__(self, name):
        self.name = name
        self.current = None
        self.history = []

    @contextmanager
    def running(self, job):
        if self.current is not None:
            raise RuntimeError(f"{self.name} is already printing {self.current}")
        self.current = job.job_id
        try:
            yield job
        finally:
            self.current = None
        self.history.append(job.job_id)


async def print_all(board, printers):
    """Prints every job on the board; returns (job_id, printer_name) pairs in start order."""
    if not printers:
        raise ValueError("at least one printer is needed")
    busy = [printer.name for printer in printers if printer.current is not None]
    if busy:
        raise ValueError(f"printers already busy: {', '.join(busy)}")

    waiting = asyncio.Queue()
    for job in board:
        waiting.put_nowait(job)
    starts = []

    async def work(printer):
        while True:
            try:
                job = waiting.get_nowait()
            except asyncio.QueueEmpty:
                return
            with printer.running(job):
                starts.append((job.job_id, printer.name))
                await asyncio.sleep(0)

    async with asyncio.TaskGroup() as tg:
        for printer in printers:
            tg.create_task(work(printer))
    return starts
