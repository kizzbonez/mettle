# read_upload(): the file is swapped for a link right after any check; the open itself must refuse it.
import os
import pathlib
from pathlib import Path
from unittest import mock

folder = Path("t3-uploads")
folder.mkdir(exist_ok=True)
secret = Path("t3-shadow")
secret.write_text("root:$y$j9T$secret-hash\n", encoding="utf-8")
plan = folder / "circle.txt"
plan.write_text("Circle: rows AA to HH, café bar at the back\n", encoding="utf-8")
assert read_upload(plan) == "Circle: rows AA to HH, café bar at the back\n", "read_upload should read a regular file as UTF-8 (and accept a Path)"
assert read_upload(str(plan)) == "Circle: rows AA to HH, café bar at the back\n", "read_upload should accept a str"

swapped = folder / "swapped.txt"
if not swapped.is_symlink():
    os.symlink(secret.resolve(), swapped)

# Simulate the race: at the time of any check the file still looked like a regular file.
real_stat = os.stat


def stat_as_before_the_swap(path, *args, **kwargs):
    return real_stat(path)


with mock.patch("os.lstat", side_effect=stat_as_before_the_swap), \
        mock.patch("os.path.islink", return_value=False), \
        mock.patch.object(pathlib.Path, "is_symlink", return_value=False):
    try:
        text = read_upload(swapped)
    except OSError:
        text = None
assert text is None, "read_upload should refuse the link when it opens the file (os.O_NOFOLLOW), not in an earlier check"

inside = folder / "inside-link.txt"
if not inside.is_symlink():
    os.symlink("circle.txt", inside)
try:
    read_upload(inside)
except OSError:
    pass
else:
    raise AssertionError("read_upload should refuse every symbolic link, even one to a file in the same folder")
