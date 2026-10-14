# Choir Rehearsal Headcount
#
# Write the four functions first, then the script part at the bottom.
# Every `raise NotImplementedError` marks a function you still have to write.
# Keep the function names and parameters as they are: the tests call them.


def normalize_section(name):
    """Return name in lower case, with single spaces between its words and none around them."""
    raise NotImplementedError


def parse_headcount(line):
    """Return (section, count) from a line such as "First Sopranos, 2", or raise ValueError."""
    raise NotImplementedError


def record(tally, section, count):
    """Keep in tally the largest count of section seen at one time."""
    raise NotImplementedError


def report_lines(tally):
    """Return the lines of the final report as a list of strings."""
    raise NotImplementedError


# The script part: read the notes until the input ends, print a message for
# each line that cannot be used, then print the report.
# TODO: write it here, below the functions.
