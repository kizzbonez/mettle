"""Practice Metronome: a tempo that can only be set to a value a metronome has."""


class Metronome:
    """Beats per minute, from LOWEST to HIGHEST."""

    LOWEST = 40
    HIGHEST = 208
    TEMPOS = {"largo": 50, "adagio": 70, "andante": 90, "moderato": 110, "allegro": 132, "presto": 180}

    def __init__(self, bpm):
        self.bpm = bpm

    @property
    def bpm(self):
        """Beats per minute."""
        return self._bpm

    @bpm.setter
    def bpm(self, value):
        if not Metronome.is_valid_bpm(value):
            raise ValueError(f"bpm must be a whole number from {self.LOWEST} to {self.HIGHEST}, not {value!r}")
        self._bpm = value

    @property
    def beat_ms(self):
        """Milliseconds between two beats."""
        return round(60000 / self._bpm)

    @classmethod
    def from_tempo(cls, name):
        key = name.strip().lower()
        if key not in cls.TEMPOS:
            raise ValueError(f"unknown tempo {name!r}")
        return cls(cls.TEMPOS[key])

    @staticmethod
    def is_valid_bpm(value):
        return isinstance(value, int) and Metronome.LOWEST <= value <= Metronome.HIGHEST
