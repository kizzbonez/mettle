"""Audio-guide clips that are shared while in use and freed when nobody listens."""
import copy
import weakref


class Clip:
    """One room's recorded clip."""

    # YOUR CODE: __slots__ with room, seconds and "__weakref__", then __init__.


class ClipCache:
    """Hand out one shared Clip per room, without keeping clips alive."""

    def __init__(self, loader):
        self.loader = loader
        # YOUR CODE: a WeakValueDictionary for this cache.

    def get(self, room):
        """Return the live clip for ROOM, loading it with the loader if there is none."""
        # YOUR CODE
        raise NotImplementedError

    def __len__(self):
        """Return how many clips in the cache are still alive."""
        # YOUR CODE
        raise NotImplementedError


def total_seconds(rooms, loader):
    """Return the total seconds of the clips of ROOMS, loading them one at a time."""
    # YOUR CODE: sum over a generator expression, not a list.
    raise NotImplementedError


def snapshot(tour):
    """Return a fully independent copy of TOUR."""
    # YOUR CODE
    raise NotImplementedError
