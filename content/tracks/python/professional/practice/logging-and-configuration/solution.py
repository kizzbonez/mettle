"""Decide which greenhouse beds need water. A library: it logs, but never configures logging."""
import logging
import tomllib
import warnings

logger = logging.getLogger("greenhouse.valves")

DEFAULTS = {"level": "WARNING", "dry_below": 30}
LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


def load_settings(path, environ):
    """Return DEFAULTS, overridden by the TOML file at PATH, overridden by ENVIRON."""
    settings = dict(DEFAULTS)
    with open(path, "rb") as file:
        settings.update(tomllib.load(file))
    if "dry" in settings:
        warnings.warn("'dry' is deprecated; use 'dry_below'", DeprecationWarning, stacklevel=2)
        settings["dry_below"] = settings.pop("dry")
    if "GREENHOUSE_LEVEL" in environ:
        level = environ["GREENHOUSE_LEVEL"].upper()
        if level not in LEVELS:
            raise ValueError(f"GREENHOUSE_LEVEL must be one of {', '.join(LEVELS)}, not {level!r}")
        settings["level"] = level
    if "GREENHOUSE_DRY_BELOW" in environ:
        text = environ["GREENHOUSE_DRY_BELOW"]
        try:
            settings["dry_below"] = int(text)
        except ValueError:
            raise ValueError(f"GREENHOUSE_DRY_BELOW must be a whole number, not {text!r}") from None
    return settings


def check_beds(readings, dry_below):
    """Return the beds reading below DRY_BELOW, logging each reading through logger."""
    if not readings:
        logger.error("no readings")
        return []
    dry = []
    for bed, value in readings.items():
        logger.debug("bed %s reads %s", bed, value)
        if value < dry_below:
            logger.warning("bed %s is dry: %s < %s", bed, value, dry_below)
            dry.append(bed)
    return dry
