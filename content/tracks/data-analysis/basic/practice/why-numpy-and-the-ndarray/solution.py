"""Club Ride Log: describe the club's rides and convert them to kilometres."""

import numpy as np

MILES_TO_KM = 1.609344


def ride_report(miles):
    """Return the shape, size, dtype and kilometre distances of the rides given in miles."""
    rides = np.array(miles)
    return {
        "shape": rides.shape,
        "size": rides.size,
        "dtype": rides.dtype,
        "km": rides * MILES_TO_KM,
    }
