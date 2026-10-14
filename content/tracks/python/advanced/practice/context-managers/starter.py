# Guest house settings: a context manager class and a generator-based one.
from contextlib import contextmanager


class Tolerate:
    def __init__(self, *exceptions):
        self.exceptions = exceptions
        self.caught = []

    def __enter__(self):
        # Return the Tolerate object itself.
        raise NotImplementedError("write __enter__")

    def __exit__(self, exc_type, exc, tb):
        # Record and suppress exceptions of the given classes (subclasses too);
        # let every other exception carry on.
        raise NotImplementedError("write __exit__")


@contextmanager
def temporary(settings, **changes):
    # Remember the old values of the changed keys, apply the changes, yield
    # settings, and always restore afterwards (delete keys that were missing).
    raise NotImplementedError("write temporary")
    yield settings
