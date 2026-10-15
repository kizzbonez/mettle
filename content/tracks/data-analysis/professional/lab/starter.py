"""airwatch: validate, store and report the classroom CO2 readings of Brookfield School."""
import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger("airwatch")

READING_COLUMNS = ["sensor", "time", "co2_ppm", "temp_c"]
TIME_FORMAT = "%Y-%m-%d %H:%M"
HIGH_PPM = 1500


def load_readings(paths):
    """Read the reading files as text and stack them.

    Return the columns file, line, sensor, time, co2_ppm, temp_c, with the index 0 to n-1.
    Raise ValueError naming the file when one of READING_COLUMNS is missing.
    """
    raise NotImplementedError


def validate(raw, rooms):
    """Split the raw rows into a tuple (clean, quarantine) by the rules in the instructions."""
    raise NotImplementedError


def summarise(clean):
    """Return one row per day and room: readings, mean_co2, max_co2, high, mean_temp."""
    raise NotImplementedError


def report(clean, quarantine, daily):
    """Return the text report, one line per row of the layout in the instructions."""
    raise NotImplementedError


def build_parser():
    """Return the argparse parser: FILE [FILE ...], --rooms and --out."""
    raise NotImplementedError


def main(argv=None):
    """Run the pipeline and return the exit status: 0 on success, 1 when the input is bad."""
    # TODO: parse the arguments, configure logging, load and validate the files, then
    # summarise, write the four output files and print the report.
    raise NotImplementedError


if __name__ == "__main__":
    sys.exit(main())
