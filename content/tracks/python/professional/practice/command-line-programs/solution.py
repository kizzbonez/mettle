"""balcony: summarise temperature readings from files or standard input."""
import argparse
import sys


def precision(text):
    """Convert TEXT to an int of 0 or more, for argparse's type=."""
    value = int(text)
    if value < 0:
        raise argparse.ArgumentTypeError(f"must be 0 or more, not {value}")
    return value


def build_parser():
    """Return the ArgumentParser for the program."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*", metavar="FILE", help="a file of readings, or - for stdin")
    parser.add_argument("-u", "--unit", choices=["c", "f"], default="c", help="unit to show (default: %(default)s)")
    parser.add_argument("-p", "--precision", type=precision, default=1, help="decimals (default: %(default)s)")
    return parser


def read_lines(name):
    """Return the lines of the file NAME, or of standard input for "-"."""
    if name == "-":
        return sys.stdin.read().splitlines()
    with open(name, encoding="utf-8") as file:
        return file.read().splitlines()


def readings_from(name):
    """Return the temperatures in NAME, warning on stderr about lines that are not numbers."""
    values = []
    for number, line in enumerate(read_lines(name), start=1):
        text = line.strip()
        if text == "":
            continue
        try:
            values.append(float(text))
        except ValueError:
            print(f"skipping {name} line {number}: '{text}'", file=sys.stderr)
    return values


def main(argv=None):
    """Run the program with ARGV (sys.argv[1:] when None) and return the exit status."""
    args = build_parser().parse_args(argv)
    values = []
    try:
        for name in args.files or ["-"]:
            values.extend(readings_from(name))
    except OSError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    if not values:
        print("error: no readings", file=sys.stderr)
        return 1
    if args.unit == "f":
        values = [value * 9 / 5 + 32 for value in values]
    digits = args.precision
    print(f"count: {len(values)}")
    print(f"min: {min(values):.{digits}f}")
    print(f"max: {max(values):.{digits}f}")
    print(f"mean: {sum(values) / len(values):.{digits}f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
