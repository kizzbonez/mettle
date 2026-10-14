def refused(value):
    try:
        Metronome(value)
    except ValueError:
        return True
    return False


assert isinstance(vars(Metronome).get("bpm"), property), "bpm is a property of the class"
assert vars(Metronome)["bpm"].fset is not None, "bpm has a setter"

assert Metronome(40).bpm == 40 and Metronome(208).bpm == 208, "40 and 208 are both allowed"
assert refused(39) and refused(209), "values just outside 40 to 208 are refused when the metronome is created"
assert refused(0) and refused(-120), "zero and negative values are refused"
assert refused(120.5) and refused(120.0), "a float is refused, even a whole one"
assert refused("120"), "text is refused"

steady = Metronome(96)
assert steady._bpm == 96, "the value is stored in the internal attribute _bpm"
assert "bpm" not in vars(steady), "the instance stores _bpm, not bpm"
for bad in [39, 209, 99.5, "fast"]:
    try:
        steady.bpm = bad
    except ValueError:
        pass
    else:
        raise AssertionError("assigning a value that is not valid raises ValueError")
    assert steady.bpm == 96, "a rejected value leaves the old bpm in place"
steady.bpm = 208
assert steady.bpm == 208 and steady._bpm == 208, "a valid value replaces the old one"
