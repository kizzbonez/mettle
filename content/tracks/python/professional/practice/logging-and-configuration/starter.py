"""Decide which greenhouse beds need water. A library: it logs, but never configures logging."""
import logging
import tomllib
import warnings

logger = logging.getLogger("greenhouse.valves")

DEFAULTS = {"level": "WARNING", "dry_below": 30}
LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


def load_settings(path, environ):
    """Return DEFAULTS, overridden by the TOML file at PATH, overridden by ENVIRON."""
    # YOUR CODE: copy DEFAULTS, update it from the file (binary mode), handle the old 'dry'
    # key with a DeprecationWarning, then apply GREENHOUSE_LEVEL and GREENHOUSE_DRY_BELOW,
    # raising ValueError that names the variable when a value is bad.
    raise NotImplementedError


def check_beds(readings, dry_below):
    """Return the beds reading below DRY_BELOW, logging each reading through logger."""
    # YOUR CODE: log each bed at DEBUG, and dry beds at WARNING, passing the values as
    # arguments. No readings at all: log 'no readings' at ERROR.
    raise NotImplementedError
