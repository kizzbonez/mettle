"""Bike Hire: fair rides, fees and overdue hires, with boolean masks."""

import numpy as np


def fair_rides(minutes):
    """The hires of at least 2 and at most 180 minutes, in their original order."""
    return minutes[(minutes >= 2) & (minutes <= 180)]


def fees(minutes):
    """0.0 under 2 minutes, 1.5 from 2 to 30 minutes, 4.0 above 30, for every hire."""
    return np.where(minutes < 2, 0.0, np.where(minutes <= 30, 1.5, 4.0))


def overdue(minutes):
    """The ascending positions of the hires longer than 180 minutes."""
    return np.nonzero(minutes > 180)[0]
