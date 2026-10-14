# new_token: length, alphabet, uniqueness, unpredictability. upload_path: traversal, links and look-alike folders.
import os
import random
import string
from pathlib import Path

allowed = set(string.ascii_letters + string.digits + "-_")
tokens = [new_token() for _ in range(200)]
for token in tokens:
    assert isinstance(token, str) and len(token) == 43, "every token should be a str of 43 characters"
    assert set(token) <= allowed, "tokens should only use URL-safe characters: letters, digits, - and _"
assert len(set(tokens)) == 200, "200 tokens should all be different"
random.seed(7)
first = new_token()
random.seed(7)
assert new_token() != first, "tokens must come from secrets: seeding random should not repeat them"

base = Path("t4-up")
(base / "alto").mkdir(parents=True, exist_ok=True)
Path("t4-up-old").mkdir(exist_ok=True)
Path("t4-outside").mkdir(exist_ok=True)
link = base / "shortcut"
if not link.is_symlink():
    os.symlink(Path("t4-outside").resolve(), link)

inside = {
    "alto/part.pdf": base / "alto" / "part.pdf",
    "alto/../tenor.pdf": base / "tenor.pdf",
    "Ave María.pdf": base / "Ave María.pdf",
}
for name, expected in inside.items():
    got = upload_path("t4-up", name)
    assert got == expected.resolve(), f"upload_path('t4-up', {name!r}) should be the resolved path inside the folder"
    assert got.is_absolute(), "upload_path should return a resolved, absolute Path"
assert upload_path(base.resolve(), "alto/part.pdf") == (base / "alto" / "part.pdf").resolve(), "base may also be a Path"

outside = [
    "../t4-outside/x.pdf",
    "../t4-up-old/x.pdf",
    "alto/../../x.pdf",
    "/etc/passwd",
    str(Path("t4-outside").resolve() / "x.pdf"),
    "shortcut/x.pdf",
]
for name in outside:
    try:
        upload_path("t4-up", name)
    except ValueError:
        continue
    raise AssertionError(f"upload_path('t4-up', {name!r}) leads out of the folder and should raise ValueError")
