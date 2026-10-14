"""balcony: summarise temperature readings from files or standard input."""
import argparse
import sys


def precision(text):
    """Convert TEXT to an int of 0 or more, for argparse's type=."""
    # YOUR CODE: int(text), and raise argparse.ArgumentTypeError when it is negative.
    raise NotImplementedError


def build_parser():
    """Return the ArgumentParser for the program."""
    parser = argparse.ArgumentParser(description=__doc__)
    # YOUR CODE: FILE (nargs="*"), -u/--unit with choices, -p/--precision with type=precision.
    return parser


def main(argv=None):
    """Run the program with ARGV (sys.argv[1:] when None) and return the exit status."""
    args = build_parser().parse_args(argv)
    # YOUR CODE: read the files ("-" or none means sys.stdin), warn about bad lines on
    # sys.stderr, print the summary on stdout, and return 0 or 1.
    return 1


if __name__ == "__main__":
    sys.exit(main())
