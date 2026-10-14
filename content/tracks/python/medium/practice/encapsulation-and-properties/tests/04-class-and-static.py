assert isinstance(vars(Metronome).get("from_tempo"), classmethod), "from_tempo is a class method"
assert isinstance(vars(Metronome).get("is_valid_bpm"), staticmethod), "is_valid_bpm is a static method"

assert Metronome.is_valid_bpm(40) is True and Metronome.is_valid_bpm(208) is True, "is_valid_bpm includes both ends"
assert Metronome.is_valid_bpm(209) is False and Metronome.is_valid_bpm(39) is False, "is_valid_bpm rejects values outside the range"
assert Metronome.is_valid_bpm(100.0) is False and Metronome.is_valid_bpm("100") is False, "is_valid_bpm accepts only an int"
assert Metronome(60).is_valid_bpm(120) is True, "is_valid_bpm can be called on an instance too"

for name, bpm in Metronome.TEMPOS.items():
    made = Metronome.from_tempo(name)
    assert isinstance(made, Metronome) and made.bpm == bpm, "from_tempo builds a Metronome for every name in TEMPOS"
assert Metronome.from_tempo("LARGO").bpm == 50, "from_tempo ignores case"
assert Metronome.from_tempo("  presto\n").bpm == 180, "from_tempo ignores whitespace around the name"
for unknown in ["vivace", "", "allegro ma non troppo"]:
    try:
        Metronome.from_tempo(unknown)
    except ValueError:
        pass
    else:
        raise AssertionError("an unknown tempo name raises ValueError")


class Folk(Metronome):
    TEMPOS = {"jig": 116, "reel": 200}


jig = Folk.from_tempo("Jig")
assert type(jig) is Folk, "from_tempo called on a subclass returns an instance of that subclass"
assert jig.bpm == 116, "from_tempo uses the TEMPOS of the class it is called on"
try:
    Folk.from_tempo("largo")
except ValueError:
    pass
else:
    raise AssertionError("a subclass only knows the names in its own TEMPOS")
