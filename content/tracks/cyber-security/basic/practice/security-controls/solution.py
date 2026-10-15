"""Control coverage check: which assets lack a control that prevents, detects or corrects?

Most of this file is already written. Write only the body of find_gaps, where it says YOUR CODE.
"""
import csv

# Every asset needs at least one control of each of these types.
REQUIRED = ["preventive", "detective", "corrective"]


def read_register(path):
    """Read a control register CSV into a list of dicts, one per row."""
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def control_types(type_field):
    """Return the set of types in one 'type' cell.

    'Deterrent; Detective' gives {'deterrent', 'detective'}. A cell can name several types
    separated by ';'. Case and spaces do not matter, and 'deterring' is the same type as 'deterrent'.
    """
    types = set()
    for part in type_field.split(";"):
        name = part.strip().lower()
        if name == "deterring":
            name = "deterrent"
        if name:
            types.add(name)
    return types


def find_gaps(rows, required=REQUIRED):
    """Return {asset: [missing types]} for every asset that lacks a type in REQUIRED."""
    covered = {}
    for row in rows:
        asset = row["asset"].strip()
        covered.setdefault(asset, set()).update(control_types(row["type"]))

    gaps = {}
    for asset, have in covered.items():
        missing = [kind for kind in required if kind not in have]
        if missing:
            gaps[asset] = missing
    return gaps


if __name__ == "__main__":
    for asset, missing in find_gaps(read_register("data/register.csv")).items():
        print(f"{asset}: missing {', '.join(missing)}")
