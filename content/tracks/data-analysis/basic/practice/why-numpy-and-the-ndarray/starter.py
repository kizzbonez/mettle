"""Club Ride Log: describe the club's rides and convert them to kilometres."""

import numpy as np

MILES_TO_KM = 1.609344


def ride_report(miles):
    """Return the shape, size, dtype and kilometre distances of the rides given in miles."""
    rides = np.array(miles)
    # TODO: replace the line below with
    #     return {"shape": ..., "size": ..., "dtype": ..., "km": ...}
    # Read the first three from the attributes of rides. For "km", multiply the
    # whole array by MILES_TO_KM in one expression: no loop, no comprehension.
    raise NotImplementedError
