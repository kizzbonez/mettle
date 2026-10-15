"""Games Night: dice, seating and cards drawn from a Generator the caller seeds."""

import numpy as np


def roll_dice(rng, rolls, dice):
    """A (rolls, dice) integer array of values from 1 to 6."""
    return rng.integers(1, 6, size=(rolls, dice), endpoint=True)


def seating(guests, rng):
    """The guests in a random order, as a new array; guests unchanged."""
    return rng.permutation(guests)


def deal_hand(deck, size, rng):
    """size different cards drawn from deck, in the order drawn."""
    return rng.choice(deck, size=size, replace=False)
