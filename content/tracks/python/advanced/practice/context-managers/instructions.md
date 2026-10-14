Write two context managers in `solution.py`, one as a class and one as a generator.

1. The class `Tolerate`. `Tolerate(*exceptions)` takes any number of exception classes and sets
   `self.caught` to an empty list.
   - `__enter__` returns the `Tolerate` object itself.
   - `__exit__`: when the block raised an exception that is an instance of one of the given
     classes (subclasses included), append the exception object to `caught` and **suppress** it.
     Any other exception carries on to the caller and is not recorded. A block that ends
     normally records nothing.
   - The same object can be used for several `with` blocks; `caught` keeps growing.
2. The generator function `temporary(settings, **changes)`, decorated with
   `contextlib.contextmanager`. `settings` is a dict.
   - On entry, it remembers the current value of each key named in `changes` (some may be
     missing from `settings`), applies the changes, and yields `settings` itself.
   - On exit, **however the block ends**, it puts back the old value of each changed key that
     existed before, and removes each changed key that did not (if the block already removed
     it, that is not an error). Keys not named in `changes` are left as the block left them. An
     exception from the block still reaches the caller.

Example:

```python
settings = {"heating": 19, "lights": "off"}
with temporary(settings, heating=23, music="jazz") as current:
    current is settings      # True
    settings                 # {'heating': 23, 'lights': 'off', 'music': 'jazz'}
settings                     # {'heating': 19, 'lights': 'off'}

quiet = Tolerate(KeyError, ValueError)
with quiet:
    int("warm")              # ValueError: suppressed
with quiet as same:
    settings["sauna"]        # KeyError: suppressed
same is quiet                                # True
[type(e).__name__ for e in quiet.caught]     # ['ValueError', 'KeyError']
with quiet:
    1 / 0                    # ZeroDivisionError reaches the caller
```

**Tip:** in `temporary`, put the restoring code in a `finally` around the `yield`.
