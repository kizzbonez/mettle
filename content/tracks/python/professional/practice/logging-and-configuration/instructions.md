`solution.py` is a **library**: the greenhouse scheduler imports it. Write two functions, and log
only through the module's logger `logger = logging.getLogger("greenhouse.valves")`, which the
starter already creates. As a library it must never configure logging: no `basicConfig`, no
handlers and no levels set anywhere, so importing it leaves the root logger without handlers.

1. `load_settings(path, environ)` returns the settings as a `dict`, in layers, each overriding
   the one before:
   - the defaults `{"level": "WARNING", "dry_below": 30}`;
   - every key of the TOML file at `path`, read with `tomllib` (open it in binary mode);
   - the environment, the `dict` `environ` (the tests pass a plain `dict`, not `os.environ`):
     `GREENHOUSE_LEVEL`, upper-cased, sets `"level"`, and `GREENHOUSE_DRY_BELOW`, converted with
     `int()`, sets `"dry_below"`. Other variables are ignored.

   Raise `ValueError` with a message that names the variable (`"GREENHOUSE_LEVEL"` or
   `"GREENHOUSE_DRY_BELOW"`) when `GREENHOUSE_LEVEL` is not one of `DEBUG`, `INFO`, `WARNING`,
   `ERROR` and `CRITICAL` after upper-casing, or when `GREENHOUSE_DRY_BELOW` is not a whole number.

   Older files call `dry_below` by its former name, `dry`. When the file has a `dry` key, issue
   `warnings.warn("'dry' is deprecated; use 'dry_below'", DeprecationWarning, stacklevel=2)` from
   `load_settings` itself, so the warning points at the caller's line, and use the value as
   `"dry_below"`: the result has no `"dry"` key. The environment still overrides it.
2. `check_beds(readings, dry_below)` takes a `dict` from bed name to its moisture reading, an
   `int`, and returns the list of dry beds, those reading below `dry_below`, in the order of
   `readings`. It logs, for each bed in order:
   - at `DEBUG`: `bed NAME reads VALUE`;
   - then, only for a dry bed, at `WARNING`: `bed NAME is dry: VALUE < DRY_BELOW`.

   With no readings at all, it logs `no readings` at `ERROR` and returns `[]`. Pass the values
   as arguments, `logger.debug("bed %s reads %s", name, value)`, never in an f-string: the tests
   check that each record keeps them in its `args`.

**Example.** `data/greenhouse.toml`:

```toml
# watering settings for the community greenhouse
dry_below = 35
beds = ["tomatoes", "herbs", "chillies"]

[pump]
litres_per_minute = 12
```

```python
load_settings("data/greenhouse.toml", {"GREENHOUSE_LEVEL": "info", "HOME": "/home/ines"})
# {'level': 'INFO', 'dry_below': 35, 'beds': ['tomatoes', 'herbs', 'chillies'],
#  'pump': {'litres_per_minute': 12}}

check_beds({"tomatoes": 41, "herbs": 22, "chillies": 35}, 35)   # ['herbs']
```

The second call logs these four records through `greenhouse.valves` (shown here as an
application might format them; the chillies are not dry, because 35 is not below 35):

```text
DEBUG greenhouse.valves: bed tomatoes reads 41
DEBUG greenhouse.valves: bed herbs reads 22
WARNING greenhouse.valves: bed herbs is dry: 22 < 35
DEBUG greenhouse.valves: bed chillies reads 35
```
