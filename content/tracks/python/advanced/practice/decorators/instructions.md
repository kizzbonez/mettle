Write two decorators in `solution.py`. The starter has the names and the registry; replace each
`raise NotImplementedError`.

1. `limit(times)` is a decorator **with an argument**, so it has three layers. `limit(times)`
   raises `ValueError` straight away when `times` is less than 1. Otherwise it returns a
   decorator, and the wrapper it builds:
   - passes every positional and keyword argument on to the original function and returns its
     result;
   - lets the function run at most `times` times. Once they are used up, a call raises
     `RuntimeError` with a message that contains the function's name, and does **not** call the
     function;
   - has an attribute `remaining`, the number of calls left: `times` at the start, one less after
     each call that was let through. A call that was let through counts even if the function
     raised;
   - keeps the original's `__name__`, `__doc__` and `__wrapped__` with `functools.wraps`.
2. `register(func)` is a plain decorator. It stores `func` in the dictionary `ACTIONS` under
   `func.__name__` and returns `func` unchanged. If that name is already in `ACTIONS`, it raises
   `ValueError` and leaves `ACTIONS` as it was.

Each decorated function has its own count. Example, with both decorators stacked:

```python
@register
@limit(2)
def open_garage(reason):
    """Open the garage door."""
    return f"garage open: {reason}"


open_garage("car")                          # 'garage open: car'
open_garage.remaining                       # 1
open_garage.__name__, open_garage.__doc__   # ('open_garage', 'Open the garage door.')
ACTIONS["open_garage"] is open_garage       # True: register received the wrapper
open_garage(reason="bike")                  # 'garage open: bike'
open_garage("again")                        # RuntimeError: open_garage may only run 2 times
limit(0)                                    # ValueError
```

**Tip:** keep the count on the wrapper itself, as the lesson's `counted` does with
`wrapper.calls`.
