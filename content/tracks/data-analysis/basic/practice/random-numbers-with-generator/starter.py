"""Games Night: dice, seating and cards drawn from a Generator the caller seeds.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. Each function makes one call on the rng it is given; never
create a generator here.
"""

import numpy as np


def roll_dice(rng, rolls, dice):
    """A (rolls, dice) integer array of values from 1 to 6."""
    # TODO: one call to rng.integers. Is its high value included?
    raise NotImplementedError


def seating(guests, rng):
    """The guests in a random order, as a new array; guests unchanged."""
    # TODO: one call to rng.permutation (rng.shuffle changes its argument and returns None).
    raise NotImplementedError


def deal_hand(deck, size, rng):
    """size different cards drawn from deck, in the order drawn."""
    # TODO: one call to rng.choice, without replacement.
    raise NotImplementedError
