# load_settings: defaults, then the file, then the environment, with typed and validated values.
import datetime
from pathlib import Path

Path("t2-extra.toml").write_text(
    'beds = ["piments 🌶", "basilic"]\nwater_at = 06:30:00\n\n[pump]\nlitres_per_minute = 9\n',
    encoding="utf-8",
)
Path("t2-empty.toml").write_text("# nothing set here\n", encoding="utf-8")
Path("t2-level.toml").write_text('level = "ERROR"\ndry_below = 20\n', encoding="utf-8")

got = load_settings("t2-extra.toml", {})
expected = {
    "level": "WARNING",
    "dry_below": 30,
    "beds": ["piments 🌶", "basilic"],
    "water_at": datetime.time(6, 30),
    "pump": {"litres_per_minute": 9},
}
assert got == expected, f"the defaults plus every key of a file with tables, times and Unicode: got {got}"

got["level"] = "CHANGED"
got = load_settings("t2-empty.toml", {})
assert got == {"level": "WARNING", "dry_below": 30}, (
    f"a file that sets nothing should give exactly the defaults, also after an earlier call: got {got}"
)

got = load_settings("t2-level.toml", {})
assert got == {"level": "ERROR", "dry_below": 20}, f"the file should override the defaults: got {got}"

got = load_settings("t2-level.toml", {"GREENHOUSE_DRY_BELOW": "45", "GREENHOUSE_LEVEL": "Debug"})
assert got == {"level": "DEBUG", "dry_below": 45}, (
    f"the environment should override the file, with the level upper-cased and dry_below an int: got {got}"
)

got = load_settings("t2-level.toml", {"greenhouse_level": "debug", "GREENHOUSE": "on", "PATH": "/usr/bin"})
assert got == {"level": "ERROR", "dry_below": 20}, f"other environment variables should be ignored: got {got}"

bad = [
    ({"GREENHOUSE_LEVEL": "loud"}, "GREENHOUSE_LEVEL"),
    ({"GREENHOUSE_LEVEL": ""}, "GREENHOUSE_LEVEL"),
    ({"GREENHOUSE_DRY_BELOW": "forty"}, "GREENHOUSE_DRY_BELOW"),
    ({"GREENHOUSE_DRY_BELOW": "4.5"}, "GREENHOUSE_DRY_BELOW"),
    ({"GREENHOUSE_DRY_BELOW": ""}, "GREENHOUSE_DRY_BELOW"),
]
for environ, name in bad:
    try:
        load_settings("t2-level.toml", environ)
    except ValueError as error:
        assert name in str(error), f"the ValueError for {environ} should name the variable {name}; it said {str(error)!r}"
    else:
        raise AssertionError(f"load_settings with the environment {environ} should raise ValueError")
