"""River Gauges: read the canoe club's depth readings, write the changes, save the season.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. A gauge file has one comment line, one header line, then
post,depth,depth,... on every line.
"""

import numpy as np


def load_gauges(path):
    """(posts, depths): int64 post numbers and a 2-D float64 array of depths, one row per post."""
    # TODO: np.loadtxt with delimiter, skiprows, usecols, dtype and ndmin as needed.
    raise NotImplementedError


def write_changes(path, posts, depths):
    """Write 'post,change_cm', then 'NUMBER,CHANGE' per post, CHANGE = last month - first month, 1 decimal."""
    # TODO: np.savetxt with a fmt for each column, header and comments="".
    raise NotImplementedError


def save_season(path, posts, depths):
    """Save posts and depths in one .npz file under those names."""
    raise NotImplementedError
