# The old 'dry' key: a DeprecationWarning that points at the caller, and the value moved to dry_below.
import warnings
from pathlib import Path

Path("t3-old.toml").write_text("dry = 25\n", encoding="utf-8")
Path("t3-new.toml").write_text('dry_below = 40\nbeds = ["kale"]\n', encoding="utf-8")

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    got = load_settings("t3-old.toml", {})
assert got == {"level": "WARNING", "dry_below": 25}, (
    f"the value of the old 'dry' key should become dry_below, and 'dry' should be gone: got {got}"
)
deprecations = [w for w in caught if issubclass(w.category, DeprecationWarning)]
assert len(deprecations) == 1, f"a file with 'dry' should give exactly one DeprecationWarning, not {len(deprecations)}"
message = str(deprecations[0].message)
assert message == "'dry' is deprecated; use 'dry_below'", f"the text of the DeprecationWarning: got {message!r}"
assert not deprecations[0].filename.endswith("solution.py"), (
    "the warning should point at the line that called load_settings (stacklevel=2), not inside solution.py"
)

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    got = load_settings("t3-old.toml", {"GREENHOUSE_DRY_BELOW": "50"})
assert got["dry_below"] == 50, "the environment should still override a value that came from 'dry'"

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    got = load_settings("t3-new.toml", {})
assert caught == [], "a file that already uses dry_below should give no warning at all"
assert got == {"level": "WARNING", "dry_below": 40, "beds": ["kale"]}, f"a file with dry_below: got {got}"
