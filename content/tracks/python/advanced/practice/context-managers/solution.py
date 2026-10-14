# Guest house settings: a context manager class and a generator-based one.
from contextlib import contextmanager


class Tolerate:
    def __init__(self, *exceptions):
        self.exceptions = exceptions
        self.caught = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc is not None and isinstance(exc, self.exceptions):
            self.caught.append(exc)
            return True
        return False


@contextmanager
def temporary(settings, **changes):
    existed = {key: settings[key] for key in changes if key in settings}
    settings.update(changes)
    try:
        yield settings
    finally:
        for key in changes:
            if key in existed:
                settings[key] = existed[key]
            else:
                settings.pop(key, None)
