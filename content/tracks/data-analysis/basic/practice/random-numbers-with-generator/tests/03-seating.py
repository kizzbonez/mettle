import numpy as np

guests = np.array([f"Guest {number}" for number in range(1, 21)])
before = guests.copy()
seats = seating(guests, np.random.default_rng(2718))
assert isinstance(seats, np.ndarray) and seats.shape == (20,), "seating returns an array of every guest"
check_array(guests, before, "seating does not change guests")
assert seats is not guests and not np.shares_memory(seats, guests), "seating returns a new array"
check_array(np.sort(seats), np.sort(before), "every guest is seated exactly once")
check_array(seats, np.random.default_rng(2718).permutation(before), "seating makes the one draw the instructions describe")

rng = np.random.default_rng(4)
first = seating(guests, rng)
second = seating(guests, rng)
replay = np.random.default_rng(4)
check_array(first, replay.permutation(before), "seating draws from the rng it is given")
check_array(second, replay.permutation(before), "a second call continues the same rng")

alone = seating(np.array(["Solo"]), np.random.default_rng(1))
check_array(alone, np.array(["Solo"]), "a single guest has only one seat")
