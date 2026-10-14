Complete the class `Metronome` in `solution.py`. The starter already has the class attributes
`LOWEST = 40`, `HIGHEST = 208` and `TEMPOS`, a dict from tempo words to beats per minute.

1. **`is_valid_bpm(value)`**, a `@staticmethod`, returns whether `value` is an `int` from
   `LOWEST` to `HIGHEST`, both included. Anything else, `120.5` or `"120"` for example, is not
   valid.
2. **`bpm`**, a property with a setter. The setter raises `ValueError` for a value that is not
   valid and otherwise stores it in the internal attribute `_bpm`; the getter returns `_bpm`.
   `__init__(self, bpm)` assigns through the property, so `Metronome(300)` raises ValueError
   too. A rejected value leaves the old one in place.
3. **`beat_ms`**, a **read-only** property, is the time between two beats in milliseconds,
   `60000 / bpm` rounded to a whole number with `round`. Nothing is stored for it, so it always
   follows `bpm`.
4. **`from_tempo(name)`**, a `@classmethod`, is an alternative constructor: it looks `name` up
   in `cls.TEMPOS`, ignoring case and spaces around it, and returns `cls(...)` with that tempo.
   An unknown name raises `ValueError`. Using `cls` means a subclass with its own `TEMPOS` gets
   instances of its own class, built from its own table.

Example:

```python
click = Metronome(120)
click.bpm, click.beat_ms          # (120, 500)
click.bpm = 60
click.beat_ms                     # 1000
click.bpm = 300                   # raises ValueError; click.bpm is still 60
click.beat_ms = 5                 # raises AttributeError: beat_ms has no setter
Metronome.from_tempo(" Allegro ").bpm   # 132
Metronome.is_valid_bpm(30)        # False
```

**Tips.** The getter must return `self._bpm`, not `self.bpm`, or it calls itself forever. A
static method can reach the class attributes through the class name: `Metronome.LOWEST`.
Check that the name is `in cls.TEMPOS` before looking it up, so the caller gets ValueError, not
KeyError.
