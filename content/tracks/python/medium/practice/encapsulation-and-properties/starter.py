"""Practice Metronome: a tempo that can only be set to a value a metronome has.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names: the tests use bpm, beat_ms, from_tempo and is_valid_bpm.
"""


class Metronome:
    """Beats per minute, from LOWEST to HIGHEST."""

    LOWEST = 40
    HIGHEST = 208
    TEMPOS = {"largo": 50, "adagio": 70, "andante": 90, "moderato": 110, "allegro": 132, "presto": 180}

    def __init__(self, bpm):
        # YOUR CODE: assign through the property, so the value is checked.
        raise NotImplementedError

    # YOUR CODE: the property bpm, with a getter that returns self._bpm and a
    # setter that raises ValueError unless is_valid_bpm(value).

    # YOUR CODE: the read-only property beat_ms, round(60000 / bpm).

    # YOUR CODE: the class method from_tempo(cls, name).

    # YOUR CODE: the static method is_valid_bpm(value).
