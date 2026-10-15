from pathlib import Path

import numpy as np

loaded = load_gauges("data/gauges.csv")
assert isinstance(loaded, tuple) and len(loaded) == 2, "load_gauges returns a tuple (posts, depths)"
posts, depths = loaded
assert isinstance(posts, np.ndarray) and posts.dtype == np.int64, "posts is an int64 array"
check_array(posts, np.array([3, 7, 8, 12, 15]), "the post numbers of data/gauges.csv, as in the example")
assert isinstance(depths, np.ndarray) and depths.dtype == np.float64, "depths is a float64 array"
assert depths.shape == (5, 4), f"depths of data/gauges.csv has one row per post and one column per month (got shape {depths.shape})"
check_array(depths[0], [131.5, 118.0, 104.5, 92.0], "the first post's depths, as in the example")

write_changes("changes.csv", posts, depths)
assert Path("changes.csv").exists(), "write_changes creates the file"
text = Path("changes.csv").read_text(encoding="utf-8")
assert text == "post,change_cm\n3,-39.5\n7,-16.5\n8,-27.5\n12,2.0\n15,-12.5\n", "changes.csv reads as in the example"

save_season("season.npz", posts, depths)
with np.load("season.npz") as archive:
    assert sorted(archive.files) == ["depths", "posts"], "season.npz holds the arrays posts and depths"
    check_array(archive["posts"], posts, "season.npz keeps the post numbers")
    check_array(archive["depths"], depths, "season.npz keeps the depths")
