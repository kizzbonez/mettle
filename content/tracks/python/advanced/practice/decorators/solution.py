# Smart-home actions: a decorator that limits calls and one that registers actions.
import functools

ACTIONS = {}


def limit(times):
    """Return a decorator that lets the function run at most `times` times."""
    if times < 1:
        raise ValueError(f"times must be at least 1, got {times}")

    def decorate(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if wrapper.remaining == 0:
                raise RuntimeError(f"{func.__name__} may only run {times} times")
            wrapper.remaining -= 1
            return func(*args, **kwargs)

        wrapper.remaining = times
        return wrapper

    return decorate


def register(func):
    """Store func in ACTIONS under func.__name__ and return func unchanged."""
    if func.__name__ in ACTIONS:
        raise ValueError(f"an action named {func.__name__!r} is already registered")
    ACTIONS[func.__name__] = func
    return func
