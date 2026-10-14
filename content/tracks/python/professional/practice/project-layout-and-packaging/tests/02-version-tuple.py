# version_tuple accepts plain release versions only.
good = {
    "0.3.1": (0, 3, 1),
    "2": (2,),
    "10.0": (10, 0),
    "2026.10.15": (2026, 10, 15),
    "1.0.0.7": (1, 0, 0, 7),
    "01.2": (1, 2),
}
for text, numbers in good.items():
    got = version_tuple(text)
    assert got == numbers, f"version_tuple({text!r}) should turn every part into an int"
    assert isinstance(got, tuple), f"version_tuple({text!r}) should return a tuple"

assert version_tuple("1.10.0") > version_tuple("1.9.0"), "the tuples should compare as numbers: 1.10.0 is newer than 1.9.0"

bad = ["", "1..0", ".1", "1.", "1.5.0rc1", "1.-2", "v1.0", "1.0 ", " 1.0", "+1.0", "1,2", "1.0.dev3"]
for text in bad:
    try:
        result = version_tuple(text)
    except ValueError:
        continue
    raise AssertionError(f"version_tuple({text!r}) should raise ValueError, because it is not a plain release (it returned {result!r})")
