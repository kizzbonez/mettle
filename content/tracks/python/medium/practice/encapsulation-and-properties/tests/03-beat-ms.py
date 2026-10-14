assert isinstance(vars(Metronome).get("beat_ms"), property), "beat_ms is a property of the class"
assert vars(Metronome)["beat_ms"].fset is None, "beat_ms has no setter"

tick = Metronome(70)
assert tick.beat_ms == 857, "beat_ms is 60000 / bpm rounded to a whole number"
assert isinstance(tick.beat_ms, int), "beat_ms is an int"
assert Metronome(208).beat_ms == 288 and Metronome(40).beat_ms == 1500, "beat_ms at both ends of the range"
assert Metronome(41).beat_ms == 1463, "beat_ms rounds to the nearest millisecond"
assert Metronome(90).beat_ms == 667 and Metronome(47).beat_ms == 1277, "beat_ms rounds up when the fraction is above a half"
tick.bpm = 100
assert tick.beat_ms == 600, "beat_ms follows bpm when bpm changes"
assert "beat_ms" not in vars(tick), "nothing is stored for beat_ms"
try:
    tick.beat_ms = 600
except AttributeError:
    pass
else:
    raise AssertionError("assigning beat_ms raises AttributeError")
