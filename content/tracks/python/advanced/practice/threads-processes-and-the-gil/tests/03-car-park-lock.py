# CarPark: enter and leave hold the lock, and many cars at once never overfill it.
import threading


def blocked_while_locked(park, method, plate):
    """Holds park.lock, calls the method in a thread, and reports whether it waited for the lock."""
    done = threading.Event()
    errors = []

    def call():
        try:
            method(plate)
        except Exception as error:
            errors.append(error)
        done.set()

    with park.lock:
        worker = threading.Thread(target=call)
        worker.start()
        waited = not done.wait(0.3)
    finished = done.wait(2)
    worker.join(2)
    return waited and finished and not errors


park = CarPark(3)
assert blocked_while_locked(park, park.enter, "LK 1"), "enter should hold self.lock, so it waits while the lock is taken"
assert park.parked == ["LK 1"] and park.free == 2, "the waiting enter completes once the lock is released"
assert blocked_while_locked(park, park.leave, "LK 1"), "leave should hold self.lock, so it waits while the lock is taken"
assert park.parked == [] and park.free == 3, "the waiting leave completes once the lock is released"

full = CarPark(5)
start = threading.Barrier(20, timeout=2)
answers = {}


def arrive(n):
    try:
        start.wait()
    except threading.BrokenBarrierError:
        pass
    answers[n] = full.enter(f"CAR {n}")


cars = [threading.Thread(target=arrive, args=(n,)) for n in range(20)]
for car in cars:
    car.start()
for car in cars:
    car.join()
winners = sorted(f"CAR {n}" for n, ok in answers.items() if ok)
assert sum(answers.values()) == 5, "twenty cars arriving together fill exactly five spaces"
assert full.free == 0 and sorted(full.parked) == winners, "parked lists exactly the cars that got True"
assert full.enter("LATE 1") is False, "a full car park refuses another car"

tiny = CarPark(0)
assert tiny.enter("ZERO") is False and tiny.parked == [] and tiny.free == 0, "a car park with no spaces refuses every car"
