from pathlib import Path

import numpy as np

posts = np.array([2, 40, 41, 300])
depths = np.array([
    [20.0, 25.0, 30.0],
    [22.1, 23.0, 23.7],
    [30.0, 28.5, 26.5],
    [18.0, 18.0, 18.0],
])
before = (posts.copy(), depths.copy())
write_changes("writing-changes.csv", posts, depths)
text = Path("writing-changes.csv").read_text(encoding="utf-8")
lines = text.splitlines()
assert lines[0] == "post,change_cm", "the first line is the header post,change_cm, with no #"
assert len(lines) == 5, "one header line and one line per post, nothing else"
assert lines[1:] == ["2,10.0", "40,1.6", "41,-3.5", "300,0.0"], (
    "each line is the whole post number and the last month minus the first, with one decimal"
)
assert text.endswith("\n"), "every line ends with a newline"
check_array(posts, before[0], "write_changes does not change posts")
check_array(depths, before[1], "write_changes does not change depths")

write_changes("writing-one.csv", np.array([9]), np.array([[12.0]]))
assert Path("writing-one.csv").read_text(encoding="utf-8").splitlines() == ["post,change_cm", "9,0.0"], (
    "a single post read once has a change of 0.0"
)
