click = Metronome(120)
assert (click.bpm, click.beat_ms) == (120, 500), "bpm and beat_ms of Metronome(120), as in the example"
click.bpm = 60
assert click.beat_ms == 1000, "beat_ms after setting bpm to 60, as in the example"
try:
    click.bpm = 300
except ValueError:
    pass
else:
    raise AssertionError("setting bpm to 300 raises ValueError, as in the example")
assert click.bpm == 60, "a rejected bpm leaves the old value, as in the example"
try:
    click.beat_ms = 5
except AttributeError:
    pass
else:
    raise AssertionError("assigning beat_ms raises AttributeError, as in the example")
assert Metronome.from_tempo(" Allegro ").bpm == 132, "Metronome.from_tempo(' Allegro '), as in the example"
assert Metronome.is_valid_bpm(30) is False, "Metronome.is_valid_bpm(30), as in the example"
