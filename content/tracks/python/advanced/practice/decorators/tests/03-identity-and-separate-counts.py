# limit: keeps the function's identity, and every decorated function has its own count.


def dim_lights(level):
    """Dim the lights to a level from 0 to 100."""
    return level


limited = limit(2)(dim_lights)
assert limited is not dim_lights, "limit returns a new wrapper function"
assert limited.__name__ == "dim_lights", "the wrapper keeps the original __name__"
assert limited.__doc__ == "Dim the lights to a level from 0 to 100.", "the wrapper keeps the original __doc__"
assert limited.__wrapped__ is dim_lights, "the wrapper's __wrapped__ is the original function"

twice = limit(2)
first = twice(lambda: "first")
second = twice(lambda: "second")
assert first() == "first" and first() == "first", "the first function gets its two calls"
try:
    answer = second()
except RuntimeError:
    answer = None
assert answer == "second", "a second function decorated by the same limit(2) has its own count"
assert second.remaining == 1, "each wrapper keeps its own remaining"
assert first.remaining == 0, "using one wrapper does not change another wrapper's remaining"

again = limit(2)(dim_lights)
assert again(50) == 50 and again.remaining == 1, "decorating the same function twice gives two separate counts"
assert limited.remaining == 2, "an unused wrapper still has all its calls"
