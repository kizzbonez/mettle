import numpy as np

posts = np.array([5, 6, 9], dtype=np.int64)
depths = np.array([[20.125, 24.0], [19.0, 18.875], [31.3333333333, 40.1]])
save_season("saving-season.npz", posts, depths)
with np.load("saving-season.npz") as archive:
    assert sorted(archive.files) == ["depths", "posts"], "the file holds exactly the arrays posts and depths"
    loaded_posts, loaded_depths = archive["posts"], archive["depths"]
assert loaded_posts.dtype == np.int64 and loaded_posts.shape == (3,), "posts loads back as int64 with its shape"
assert loaded_depths.dtype == np.float64 and loaded_depths.shape == (3, 2), "depths loads back as float64 with its shape"
assert np.array_equal(loaded_posts, posts), "posts loads back with exactly its values"
assert np.array_equal(loaded_depths, depths), "depths loads back with every digit, not rounded"

small = np.array([[1.5]])
save_season("saving-small.npz", np.array([77]), small)
with np.load("saving-small.npz") as archive:
    assert archive["depths"].shape == (1, 1) and archive["depths"][0, 0] == 1.5, "a season of one post and one month"
    assert archive["posts"].tolist() == [77], "the post number of a season of one post"

posts_back, depths_back = load_gauges("data/gauges.csv")
save_season("saving-millbrook.npz", posts_back, depths_back)
with np.load("saving-millbrook.npz") as archive:
    assert np.array_equal(archive["depths"], depths_back) and np.array_equal(archive["posts"], posts_back), (
        "the Millbrook season loads back exactly"
    )
