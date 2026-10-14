"""The Hollow Oak Makerspace print controller: jobs, the job board, printers and the night run."""

import asyncio
from contextlib import contextmanager
from dataclasses import dataclass


class PrintJob:
    """One print job: priority (1 to 5), job_id, grams.

    TODO: make this a frozen, ordered dataclass with the fields priority, job_id and grams,
    in that order, and validate them in __post_init__.
    """

    def __init__(self, priority, job_id, grams):
        raise NotImplementedError


class JobBoard:
    """The jobs waiting to be printed, with unique ids."""

    def __init__(self, jobs=()):
        raise NotImplementedError

    def add(self, job):
        raise NotImplementedError

    def __len__(self):
        raise NotImplementedError

    def __iter__(self):
        raise NotImplementedError

    def __contains__(self, item):
        raise NotImplementedError

    def __getitem__(self, job_id):
        raise NotImplementedError

    def __repr__(self):
        raise NotImplementedError


class Printer:
    """A printer that prints one job at a time and remembers what it printed."""

    def __init__(self, name):
        self.name = name
        self.current = None
        self.history = []

    def running(self, job):
        """Returns a context manager that reserves the printer while `job` prints."""
        raise NotImplementedError


async def print_all(board, printers):
    """Prints every job on the board; returns (job_id, printer_name) pairs in start order."""
    raise NotImplementedError
