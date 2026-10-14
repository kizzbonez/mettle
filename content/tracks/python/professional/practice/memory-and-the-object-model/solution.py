"""Audio-guide clips that are shared while in use and freed when nobody listens."""
import copy
import weakref


class Clip:
    """One room's recorded clip."""

    __slots__ = ("room", "seconds", "__weakref__")

    def __init__(self, room, seconds):
        self.room = room
        self.seconds = seconds


class ClipCache:
    """Hand out one shared Clip per room, without keeping clips alive."""

    def __init__(self, loader):
        self.loader = loader
        self.clips = weakref.WeakValueDictionary()

    def get(self, room):
        """Return the live clip for ROOM, loading it with the loader if there is none."""
        clip = self.clips.get(room)
        if clip is None:
            clip = self.loader(room)
            self.clips[room] = clip
        return clip

    def __len__(self):
        """Return how many clips in the cache are still alive."""
        return len(self.clips)


def total_seconds(rooms, loader):
    """Return the total seconds of the clips of ROOMS, loading them one at a time."""
    return sum(loader(room).seconds for room in rooms)


def snapshot(tour):
    """Return a fully independent copy of TOUR."""
    return copy.deepcopy(tour)
