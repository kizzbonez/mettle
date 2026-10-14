# parse_headcount must raise ValueError with the message of the first rule a line breaks.
def message_for(line):
    try:
        parse_headcount(line)
    except ValueError as error:
        return str(error)
    return None


cases = [
    ("tenors 2", "expected 'section, count'"),
    ("tenors, 2, 3", "expected 'section, count'"),
    ("a,b,c", "expected 'section, count'"),
    ("  , 4", "section is missing"),
    (", x", "section is missing"),
    ("tenors, two", "count is not a whole number"),
    ("tenors, 2.5", "count is not a whole number"),
    ("tenors,", "count is not a whole number"),
    ("tenors, 0", "count must be at least 1"),
    ("tenors, -2", "count must be at least 1"),
]
for line, wanted in cases:
    got = message_for(line)
    assert got is not None, f"parse_headcount({line!r}) should raise ValueError"
    assert got == wanted, f"the ValueError message for parse_headcount({line!r}) does not match the instructions"
