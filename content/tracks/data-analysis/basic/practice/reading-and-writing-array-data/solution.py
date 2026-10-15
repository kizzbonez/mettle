"""River Gauges: read the canoe club's depth readings, write the changes, save the season."""

import numpy as np


def load_gauges(path):
    """(posts, depths): int64 post numbers and a 2-D float64 array of depths, one row per post."""
    table = np.loadtxt(path, delimiter=",", skiprows=2, ndmin=2)
    return table[:, 0].astype(np.int64), table[:, 1:]


def write_changes(path, posts, depths):
    """Write 'post,change_cm', then 'NUMBER,CHANGE' per post, CHANGE = last month - first month, 1 decimal."""
    changes = depths[:, -1] - depths[:, 0]
    rows = np.stack([posts, changes], axis=1)
    np.savetxt(path, rows, delimiter=",", fmt=["%d", "%.1f"], header="post,change_cm", comments="")


def save_season(path, posts, depths):
    """Save posts and depths in one .npz file under those names."""
    np.savez(path, posts=posts, depths=depths)
