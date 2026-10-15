import numpy as np

rolls = roll_dice(np.random.default_rng(31415), 2000, 3)
assert isinstance(rolls, np.ndarray) and rolls.shape == (2000, 3), "roll_dice has one row per throw and one column per die"
assert rolls.dtype.kind in "iu", "roll_dice returns integers"
assert rolls.min() == 1 and rolls.max() == 6, "every value is from 1 to 6, and both 1 and 6 come up"
check_array(np.unique(rolls), np.arange(1, 7), "all six faces come up in six thousand dice")
check_array(rolls, np.random.default_rng(31415).integers(1, 7, size=(2000, 3)), "roll_dice makes the one draw the instructions describe")

rng = np.random.default_rng(99)
first = roll_dice(rng, 4, 2)
second = roll_dice(rng, 4, 2)
replay = np.random.default_rng(99)
check_array(first, replay.integers(1, 7, size=(4, 2)), "roll_dice draws from the rng it is given")
check_array(second, replay.integers(1, 7, size=(4, 2)), "a second call continues the same rng instead of starting again")

check_array(roll_dice(np.random.default_rng(99), 4, 2), first, "the same seed rolls the same dice")
single = roll_dice(np.random.default_rng(5), 1, 1)
assert single.shape == (1, 1), "one throw of one die is still a (1, 1) array"
