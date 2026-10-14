# Car park: threads that run together, a lock, and a process pool.
import threading
from concurrent.futures import ProcessPoolExecutor


def run_together(jobs):
    results = [None] * len(jobs)

    def run(index, job):
        results[index] = job()

    threads = [threading.Thread(target=run, args=(index, job)) for index, job in enumerate(jobs)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    return results


class CarPark:
    def __init__(self, spaces):
        self.free = spaces
        self.parked = []
        self.lock = threading.Lock()

    def enter(self, plate):
        with self.lock:
            if self.free == 0:
                return False
            self.free -= 1
            self.parked.append(plate)
            return True

    def leave(self, plate):
        with self.lock:
            if plate not in self.parked:
                raise ValueError(f"{plate} is not parked here")
            self.parked.remove(plate)
            self.free += 1


def checksum(text):
    """CPU-bound work: a checksum of the text. Ready to use; do not change it."""
    total = 0
    for position, char in enumerate(text, start=1):
        total = (total + position * ord(char)) % 65_521
    return total


def checksums(texts):
    with ProcessPoolExecutor(max_workers=2) as pool:
        return list(pool.map(checksum, texts))
