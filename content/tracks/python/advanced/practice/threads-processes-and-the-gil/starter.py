# Car park: threads that run together, a lock, and a process pool.
import threading
from concurrent.futures import ProcessPoolExecutor


def run_together(jobs):
    # One threading.Thread per job, all started before any is joined.
    # Return the results in the order of jobs.
    raise NotImplementedError("write run_together")


class CarPark:
    def __init__(self, spaces):
        self.free = spaces
        self.parked = []
        self.lock = threading.Lock()

    def enter(self, plate):
        # Holding self.lock: take a space and return True, or return False.
        raise NotImplementedError("write enter")

    def leave(self, plate):
        # Holding self.lock: free the plate's space, or raise ValueError.
        raise NotImplementedError("write leave")


def checksum(text):
    """CPU-bound work: a checksum of the text. Ready to use; do not change it."""
    total = 0
    for position, char in enumerate(text, start=1):
        total = (total + position * ord(char)) % 65_521
    return total


def checksums(texts):
    # Map checksum over texts in a ProcessPoolExecutor(max_workers=2).
    raise NotImplementedError("write checksums")
