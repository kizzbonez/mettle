"""weighbridge: total weight per material from the recycling centre's weighbridge tickets.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them and run the file as a program.
"""
import argparse
import logging
import sys

import pandas as pd

logger = logging.getLogger("weighbridge")
REQUIRED = ["ticket", "material", "weight_kg"]


def read_tickets(path):
    """Read the tickets as text and check that the required columns are there."""
    # Raise ValueError naming the file and every missing column; log at INFO what was read.
    raise NotImplementedError


def totals(tickets, min_kg):
    """Tickets and total weight per material, counting only tickets of at least MIN_KG."""
    raise NotImplementedError


def build_parser():
    """The command line: a positional tickets file and --min-kg (float, default 5.0)."""
    raise NotImplementedError


def main(argv=None):
    """Run the steps, print the table, and return the exit status."""
    raise NotImplementedError


if __name__ == "__main__":
    sys.exit(main())
