"""coop: monthly bulk-order totals and invoices for the Riverside Food Co-op."""
import argparse
import csv
import json
import logging
import sys
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

logger = logging.getLogger("coop")

CENT = Decimal("0.01")


def load_prices(path):
    """Return the price list in PATH as a dict of item id to Decimal price.

    Raise ValueError when the file is not valid JSON, has no "items" object, or holds a
    price that is not a string, not a number, or negative.
    """
    raise NotImplementedError


def read_orders(path, prices):
    """Return member -> {item id: total quantity} for the valid lines of the order file.

    Log a warning for every line that is skipped (see the instructions for the messages).
    """
    raise NotImplementedError


def bill(items, prices, fee_percent):
    """Return (subtotal, fee, total) for one member's items.

    The fee is subtotal * fee_percent / 100, rounded half up to whole cents.
    """
    raise NotImplementedError


def build_parser():
    """Return the argparse parser with the subcommands totals and invoice."""
    # TODO: both subcommands take --orders, --prices and --fee; invoice also takes MEMBER.
    raise NotImplementedError


def main(argv=None):
    """Run the program and return its exit status."""
    # TODO: parse the arguments, configure logging to stderr, load the files,
    # print the totals or the invoice, and return 0, or log an error and return 1.
    raise NotImplementedError


if __name__ == "__main__":
    sys.exit(main())
