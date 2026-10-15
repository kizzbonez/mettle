"""Bike Hire: fair rides, fees and overdue hires, with boolean masks.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. minutes is a 1-D float array; do not change it.
"""

import numpy as np


def fair_rides(minutes):
    """The hires of at least 2 and at most 180 minutes, in their original order."""
    # TODO: one mask made of two comparisons joined with &.
    raise NotImplementedError


def fees(minutes):
    """0.0 under 2 minutes, 1.5 from 2 to 30 minutes, 4.0 above 30, for every hire."""
    # TODO: np.where inside np.where.
    raise NotImplementedError


def overdue(minutes):
    """The ascending positions of the hires longer than 180 minutes."""
    # TODO: np.nonzero of a mask.
    raise NotImplementedError
