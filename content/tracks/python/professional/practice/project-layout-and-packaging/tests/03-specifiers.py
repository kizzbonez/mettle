# allows: every operator, spaces, padding with zeros, ~= and unknown operators.
cases = [
    (">=1.4", "1.4", True),
    (">= 1.4", "1.3.9", False),
    ("  >=  2.0  ", "10.0", True),
    ("<= 2.0", "2.0.0", True),
    ("<= 2.0", "2.0.1", False),
    ("> 1.9", "1.10", True),
    ("> 1.4", "1.4.0", False),
    ("< 3", "2.99.99", True),
    ("< 3", "3.0", False),
    ("==1.4.0", "1.4", True),
    ("== 1.4", "1.4.1", False),
    ("!= 1.4", "1.4.0", False),
    ("!= 1.4", "1.4.1", True),
    ("~= 1.4.2", "1.4.2", True),
    ("~= 1.4.2", "1.4.9", True),
    ("~= 1.4.2", "1.4.1", False),
    ("~= 1.4.2", "1.5.0", False),
    ("~= 1.4.2", "1.4", False),
    ("~=1.4.2", "1.4.10.3", True),
    ("~= 2.2", "2.9", True),
    ("~= 2.2", "2.2", True),
    ("~= 2.2", "2.1.9", False),
    ("~= 2.2", "3.0", False),
    ("~= 2.2", "3", False),
    ("~= 2.2.0", "2.2.5", True),
    ("~= 2.2.0", "2.3", False),
]
for specifier, version, expected in cases:
    got = allows(specifier, version)
    assert got is expected, f"allows({specifier!r}, {version!r}) gave the wrong answer"

for specifier in ["=> 1.0", "1.0", "= 1.0", "~ 1.0", "", "~= 2", ">= 1.4rc1"]:
    try:
        allows(specifier, "1.4")
    except ValueError:
        continue
    raise AssertionError(f"allows({specifier!r}, '1.4') should raise ValueError for a clause it cannot read")
