---
title: Logging and Configuration
summary: Report what a program does with the logging module (loggers, levels, handlers, formatters and propagation), configure it with dictConfig, log correctly from libraries and applications, emit warnings, and read settings from TOML files and environment variables.
minutes: 35
objectives:
  - Create module loggers, choose levels, and pass message arguments the lazy way
  - Explain how records flow through loggers, handlers and formatters, and configure them with dictConfig
  - Log from a library without configuring logging, and produce structured JSON log lines
  - Issue and filter warnings, and load settings from a TOML file with environment variable overrides
---

## Outline

1. Why not `print`
2. Loggers and levels
3. Handlers, formatters and propagation
4. Libraries and applications
5. Structured logs
6. The `warnings` module
7. Configuration from TOML and the environment

## Why not `print`

`print` writes to standard output, which is where a program's *results* go. Messages about what
the program is doing belong elsewhere, and someone running it should be able to turn them up,
down or off without editing code. The `logging` module does that. The logging HOWTO's rule of
thumb: `print` for ordinary output, a logger's `info` or `debug` for events, `warnings.warn` for
something the caller should change, an exception for an error, and a logger's `error` or
`exception` for an error you handle and carry on from.

## Loggers and levels

A **logger** is a named object you send messages to. Each message has a **level**: `DEBUG` (10),
`INFO` (20), `WARNING` (30), `ERROR` (40) or `CRITICAL` (50). Unless configured otherwise, only
`WARNING` and above are shown.

```python
import logging

logger = logging.getLogger("backup")


def copy_files(names):
    copied = 0
    for name in names:
        if name.endswith(".tmp"):
            logger.debug("skipping %s", name)
            continue
        logger.info("copied %s", name)
        copied += 1
    if copied == 0:
        logger.warning("nothing to copy among %d files", len(names))
    return copied


logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
copy_files(["notes.txt", "draft.tmp"])
copy_files([])
try:
    1 / 0
except ZeroDivisionError:
    logger.exception("could not compute the ratio")
```

```text
INFO backup: copied notes.txt
WARNING backup: nothing to copy among 0 files
ERROR backup: could not compute the ratio
Traceback (most recent call last):
  File "/tmp/log1.py", line 23, in <module>
    1 / 0
    ~~^~~
ZeroDivisionError: division by zero
```

- In a module, name the logger `logging.getLogger(__name__)`, so names follow your package
  structure (`shop.billing`). The literal `"backup"` above stands in for that.
- Pass values as **arguments**, `logger.info("copied %s", name)`, not as an f-string. The text is
  only built if the message will actually be emitted.
- `logger.exception` logs at `ERROR` and adds the traceback. Call it inside an `except` block.
- `basicConfig` sets up the **root logger**, the ancestor of all loggers. Call it once, early, in
  the program's entry point. All of this output went to **standard error**, which keeps standard
  output clean for results.

## Handlers, formatters and propagation

A log call creates a **record**. The logger drops it if it is below the logger's level, then gives
it to its **handlers**, which decide where it goes (`StreamHandler` for a stream,
`FileHandler`, `RotatingFileHandler` and many more). Each handler has its own level and a
**formatter** that turns the record into text. Then the record **propagates**: it goes on to the
handlers of every ancestor logger. Logger names with dots form the tree: `weather.client` is a
child of `weather`, which is a child of the root. A logger with no level set uses its nearest
ancestor's.

Larger programs describe all of this in one dictionary and pass it to
`logging.config.dictConfig`:

```python
import logging
import logging.config

library_logger = logging.getLogger("weather.client")
library_logger.addHandler(logging.NullHandler())

CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "plain": {"format": "%(asctime)s %(levelname)-7s %(name)s: %(message)s",
                  "datefmt": "%H:%M:%S"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "plain",
            "stream": "ext://sys.stderr",
        },
    },
    "loggers": {
        "weather": {"level": "DEBUG"},
    },
    "root": {"level": "WARNING", "handlers": ["console"]},
}

logging.config.dictConfig(CONFIG)
app_logger = logging.getLogger("app")

library_logger.debug("GET /forecast?city=Lisbon")
app_logger.info("starting")            # below the root's WARNING: dropped
app_logger.warning("cache is cold")
print(library_logger.getEffectiveLevel(), app_logger.getEffectiveLevel())
```

```text
19:31:44 DEBUG   weather.client: GET /forecast?city=Lisbon
19:31:44 WARNING app: cache is cold
10 30
```

One handler sits on the root. `weather.client` has no level, so it inherits `DEBUG` from `weather`;
its record propagates up to the root's handler. `app` inherits `WARNING` from the root. `version`
must be 1, and `ext://sys.stderr` means "the object `sys.stderr`". Leave
`disable_existing_loggers` at `False`: its default, `True`, silences every logger that existed
before the call and is not named in the configuration, such as those of libraries you imported.

## Libraries and applications

The application owns the configuration; a library never configures logging. A library creates
named loggers, logs to them, and at most adds a `NullHandler` to its top logger, as `weather.client`
did. It never calls `basicConfig`, never logs to the root logger, and never adds real handlers,
because that would decide for the application where messages go.

## Structured logs

Log collectors search better when each line is data, not prose. A formatter can write JSON
(`json.dumps` turns a dict into JSON text; lesson 5 covers the module). The `extra` argument adds
attributes to the record:

```python
import json
import logging
import sys


class JsonFormatter(logging.Formatter):
    def format(self, record):
        entry = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        entry.update(getattr(record, "fields", {}))
        return json.dumps(entry)


handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(JsonFormatter())
logger = logging.getLogger("orders")
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

logger.info("order paid", extra={"fields": {"order_id": 1042, "cents": 2599}})
logger.warning("stock low for %s", "SKU-7", extra={"fields": {"left": 2}})
```

```text
{"level": "INFO", "logger": "orders", "message": "order paid", "order_id": 1042, "cents": 2599}
{"level": "WARNING", "logger": "orders", "message": "stock low for SKU-7", "left": 2}
```

## The `warnings` module

A **warning** tells the *programmer* calling your code that something should change, typically a
deprecation. `warnings.warn(message, category, stacklevel=2)` points the report at the caller's
line instead of yours:

```python
import warnings


def area(width, height=None):
    if height is None:
        warnings.warn(
            "area(width) is deprecated; pass the height too",
            DeprecationWarning,
            stacklevel=2,
        )
        height = width
    return width * height


print(area(3))
print(area(3))

with warnings.catch_warnings():
    warnings.simplefilter("error", DeprecationWarning)
    try:
        area(4)
    except DeprecationWarning as error:
        print("raised:", error)
```

Standard output:

```text
9
9
raised: area(width) is deprecated; pass the height too
```

Standard error:

```text
/tmp/warn1.py:15: DeprecationWarning: area(width) is deprecated; pass the height too
  print(area(3))
/tmp/warn1.py:16: DeprecationWarning: area(width) is deprecated; pass the height too
  print(area(3))
```

The default filter shows each warning once per location, so the two calls on two lines both
report. `DeprecationWarning` is **hidden by default** unless triggered by code in `__main__`, which
is why test runs and `python -W error::DeprecationWarning` are where you see deprecations in
libraries. `catch_warnings` saves and restores the filters, and `"error"` turns warnings into
exceptions.

## Configuration from TOML and the environment

Settings usually come in layers, each overriding the one before: defaults in code, a config file,
**environment variables** (`os.environ`, a dict of strings), then command-line options (lesson 4).
`tomllib` reads TOML; Python 3.15 supports TOML 1.1. It only reads, and needs a binary file:

```python
import os
import tomllib
from pathlib import Path

DEFAULTS = {"level": "WARNING", "target": "/srv/backup", "keep_days": 7}

Path("backup.toml").write_text(
    '# backup settings\n'
    'target = "/mnt/nas/backup"\n'
    'keep_days = 30\n'
    '\n'
    '[schedule]\n'
    'at = 02:30:00\n',
    encoding="utf-8",
)


def load_settings(path, environ):
    settings = dict(DEFAULTS)
    with open(path, "rb") as file:
        settings.update(tomllib.load(file))
    if "BACKUP_LEVEL" in environ:
        settings["level"] = environ["BACKUP_LEVEL"].upper()
    if "BACKUP_KEEP_DAYS" in environ:
        settings["keep_days"] = int(environ["BACKUP_KEEP_DAYS"])
    return settings


os.environ["BACKUP_LEVEL"] = "debug"  # as if the shell had run: export BACKUP_LEVEL=debug
print(load_settings("backup.toml", os.environ))

try:
    tomllib.loads('target = "/mnt/nas\nkeep_days = 30\n')
except tomllib.TOMLDecodeError as error:
    print(f"bad config at line {error.lineno}, column {error.colno}: {error.msg}")
```

```text
{'level': 'DEBUG', 'target': '/mnt/nas/backup', 'keep_days': 30, 'schedule': {'at': datetime.time(2, 30)}}
bad config at line 1, column 19: Illegal character '\n'
```

TOML values arrive typed (`30` is an `int`, `02:30:00` a `datetime.time`), but environment values
are always strings, so convert and validate them. Passing `environ` in, instead of reading
`os.environ` inside, makes the function easy to test with a plain dict.

## Common mistakes

- **Arguments without placeholders.** `logger.info("copied", name)` prints `--- Logging error ---`
  and `TypeError: not all arguments converted during string formatting (required 0, got 1)`.
  Write `logger.info("copied %s", name)`.
- **Configuring too late.** A module-level `logging.warning(...)` configures the root logger
  itself, and a later `basicConfig(level=logging.DEBUG)` then does nothing. Configure first, or
  pass `force=True`.
- **Duplicate lines.** Adding a handler to `shop` while the root also has one prints each message
  twice, because the record propagates. Put handlers on the root only, or set `propagate = False`.
- **Text mode for TOML.** `tomllib.load(open("a.toml"))` raises `TypeError: File must be opened in
  binary mode, e.g. use open('foo.toml', 'rb')`.

## Practice

1. Make `basicConfig` print lines like `12:00:01 ERROR billing: card declined`.
2. A library module wants to log. Which two lines should it contain, and which must it never call?
3. Read `BACKUP_KEEP_DAYS` so that a non-number gives a clear `ValueError` naming the variable.

### Answers

1. `logging.basicConfig(format="%(asctime)s %(levelname)s %(name)s: %(message)s",
   datefmt="%H:%M:%S")`, logging through `logging.getLogger("billing")`.
2. `logger = logging.getLogger(__name__)` and, in the package's top module,
   `logging.getLogger("package").addHandler(logging.NullHandler())`. Never `basicConfig`.
3. ```python
   def keep_days(environ):
       text = environ.get("BACKUP_KEEP_DAYS", "7")
       try:
           return int(text)
       except ValueError:
           raise ValueError(f"BACKUP_KEEP_DAYS must be a whole number, not {text!r}") from None
   ```

## Key takeaways

- Use `logging.getLogger(__name__)` and pass message arguments separately.
- Records flow logger, handlers, formatter, then propagate to ancestors' handlers.
- Applications configure logging once (`basicConfig` or `dictConfig`); libraries never do.
- `warnings.warn(..., stacklevel=2)` addresses the calling programmer; deprecations are hidden by default.
- Layer settings: defaults, TOML file (`tomllib`, binary mode), environment, command line.

## Further reading

- [Logging HOWTO](https://docs.python.org/3.15/howto/logging.html)
- [logging.config: dictConfig schema](https://docs.python.org/3.15/library/logging.config.html)
- [warnings: Warning control](https://docs.python.org/3.15/library/warnings.html)
- [tomllib: Parse TOML files](https://docs.python.org/3.15/library/tomllib.html)
