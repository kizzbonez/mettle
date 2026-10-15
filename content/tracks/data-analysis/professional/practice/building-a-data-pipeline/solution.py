"""weighbridge: total weight per material from the recycling centre's weighbridge tickets."""
import argparse
import logging
import sys

import pandas as pd

logger = logging.getLogger("weighbridge")
REQUIRED = ["ticket", "material", "weight_kg"]


def read_tickets(path):
    """Read the tickets as text and check that the required columns are there."""
    tickets = pd.read_csv(path, dtype=str)
    missing = [column for column in REQUIRED if column not in tickets.columns]
    if missing:
        raise ValueError(f"{path} has no column {', '.join(missing)}")
    logger.info("read %d tickets from %s", len(tickets), path)
    return tickets


def totals(tickets, min_kg):
    """Tickets and total weight per material, counting only tickets of at least MIN_KG."""
    weight = pd.to_numeric(tickets["weight_kg"], errors="coerce")
    keep = weight >= min_kg
    logger.info("kept %d of %d tickets (at least %s kg)", keep.sum(), len(tickets), min_kg)
    kept = pd.DataFrame({
        "material": tickets["material"].str.strip().str.lower(),
        "weight_kg": weight,
    })[keep]
    summary = kept.groupby("material", as_index=False).agg(
        tickets=("weight_kg", "size"),
        total_kg=("weight_kg", "sum"),
    )
    return summary.round({"total_kg": 1})


def build_parser():
    parser = argparse.ArgumentParser(prog="weighbridge", description=__doc__)
    parser.add_argument("tickets", help="weighbridge tickets (CSV)")
    parser.add_argument("--min-kg", type=float, default=5.0, help="lightest ticket counted (default: 5)")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        summary = read_tickets(args.tickets).pipe(totals, args.min_kg)
    except (OSError, ValueError) as error:
        logger.error("%s", error)
        return 1
    if summary.empty:
        logger.error("no ticket of at least %s kg in %s", args.min_kg, args.tickets)
        return 1
    print(summary.to_string(index=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
