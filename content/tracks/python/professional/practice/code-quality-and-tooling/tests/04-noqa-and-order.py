# # noqa with codes, bare # noqa, comments on other lines, and the order of the problems.
SOURCE = '''def BadName(x):  # noqa: N802
    return x == None  # noqa: E711, N802


def OtherName(y):  # noqa
    return y != None  # noqa: N802


def ThirdName(z):  # noqa:E711,N802
    return z  # noqa: E711


def FourthName(w):
    # noqa: N802
    return w == None or None == w  # noqa: W291 E711


@register(kind == None)
def handler(event):
    return event == None


def Mixed(flag=(None == 0)): return flag != None
'''

N802 = "should be lowercase"
E711 = "E711 comparison to None should use 'is' or 'is not'"


def line_of(text):
    """The number of the line of SOURCE that contains TEXT."""
    return next(n for n, line in enumerate(SOURCE.splitlines(), start=1) if text in line)


expected = [
    f"line {line_of('def OtherName')}: N802 function name 'OtherName' {N802}",
    f"line {line_of('return y != None')}: {E711}",
    f"line {line_of('def FourthName')}: N802 function name 'FourthName' {N802}",
    f"line {line_of('@register')}: {E711}",
    f"line {line_of('return event == None')}: {E711}",
    f"line {line_of('def Mixed')}: N802 function name 'Mixed' {N802}",
    f"line {line_of('def Mixed')}: {E711}",
    f"line {line_of('def Mixed')}: {E711}",
]
got = lint(SOURCE)
assert got == expected, (
    "# noqa: CODE should drop only the listed codes on its own line (a bare # noqa drops nothing), "
    "and the problems should be sorted by line, then column; lint returned:\n" + "\n".join(map(str, got))
)
