from pathlib import Path

import numpy as np

posts, depths = load_gauges("data/gauges.csv")
check_array(depths, [
    [131.5, 118.0, 104.5, 92.0],
    [88.0, 80.5, 76.0, 71.5],
    [145.5, 141.0, 129.5, 118.0],
    [62.0, 63.5, 62.5, 64.0],
    [110.0, 96.5, 93.0, 97.5],
], "every depth of data/gauges.csv, without the post numbers", strict=True)

Path("loading-one-post.csv").write_text("# one post only\npost,may,jun,jul\n101,18.5,20.0,26.5\n", encoding="utf-8")
posts, depths = load_gauges("loading-one-post.csv")
assert isinstance(depths, np.ndarray) and depths.shape == (1, 3), "a file with a single post gives depths of shape (1, months)"
check_array(depths, [[18.5, 20.0, 26.5]], "the depths of a file with a single post")
assert posts.dtype == np.int64 and posts.shape == (1,), "a file with a single post gives one int64 post number"
check_array(posts, np.array([101]), "the post number of a file with a single post")

Path("loading-one-month.csv").write_text("# first reading\npost,apr\n1,20.0\n2,19.5\n4,21.25\n", encoding="utf-8")
posts, depths = load_gauges("loading-one-month.csv")
assert depths.shape == (3, 1), "a file with a single month gives depths of shape (posts, 1)"
check_array(depths, [[20.0], [19.5], [21.25]], "the depths of a file with a single month")
check_array(posts, np.array([1, 2, 4]), "the post numbers of a file with a single month", strict=True)
