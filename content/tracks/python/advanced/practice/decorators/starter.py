# Smart-home actions: a decorator that limits calls and one that registers actions.
import functools

ACTIONS = {}


def limit(times):
    """Return a decorator that lets the function run at most `times` times.

    - Raise ValueError at once if times is less than 1.
    - The wrapper passes *args and **kwargs on and returns the result.
    - wrapper.remaining starts at times and goes down by one per call let through.
    - When no calls are left, raise RuntimeError (mention the function's name)
      without calling the function.
    - Use functools.wraps(func) on the wrapper.
    """
    raise NotImplementedError("write limit")


def register(func):
    """Store func in ACTIONS under func.__name__ and return func unchanged.

    Raise ValueError if the name is already in ACTIONS.
    """
    raise NotImplementedError("write register")
