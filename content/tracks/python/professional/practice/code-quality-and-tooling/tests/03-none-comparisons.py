# E711: both sides, both operators, chains, comprehensions, columns on one line, and what is fine.
SOURCE = '''def check(a, b, c):
    if a == None:
        pass
    if None != b:
        pass
    if a is None or b is not None:
        pass
    if a == "None" or c in [None] or a < None:
        pass
    if 0 < a == None:
        pass
    if a == None == b:
        pass
    found = [x for x in c if x != None]
    flag = (a == None) if (b != None) else c
    return found, flag, a == b
'''

E711 = "E711 comparison to None should use 'is' or 'is not'"


def line_of(text):
    """The number of the line of SOURCE that contains TEXT."""
    return next(n for n, line in enumerate(SOURCE.splitlines(), start=1) if text in line)


expected = [
    f"line {line_of('if a == None:')}: {E711}",
    f"line {line_of('if None != b:')}: {E711}",
    f"line {line_of('if 0 < a == None:')}: {E711}",
    f"line {line_of('if a == None == b:')}: {E711}",
    f"line {line_of('found = ')}: {E711}",
    f"line {line_of('flag = ')}: {E711}",
    f"line {line_of('flag = ')}: {E711}",
]
got = lint(SOURCE)
assert got == expected, (
    "E711 should report each == or != comparison with None once, on either side, inside chains and "
    "comprehensions, and ignore is, strings, 'in' and '<'; lint returned:\n" + "\n".join(map(str, got))
)
