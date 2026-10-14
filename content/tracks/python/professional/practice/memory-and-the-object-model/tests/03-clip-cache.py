# ClipCache: sharing, counting live clips, never keeping them alive, and one dictionary per cache.
import gc
import weakref

freed = []
loads = []


def loader(room):
    loads.append(room)
    clip = Clip(room, 60)
    weakref.finalize(clip, freed.append, room)
    return clip


cache = ClipCache(loader)
assert len(cache) == 0, "a new cache should be empty"
rome, vikings = cache.get("Rome"), cache.get("Vikings")
assert cache.get("Rome") is rome and cache.get("Vikings") is vikings, "get should share each clip that is in use"
assert loads == ["Rome", "Vikings"], f"each room should be loaded once while in use; loads were {loads}"
assert len(cache) == 2, f"two clips in use: len(cache) should be 2, not {len(cache)}"

del rome
gc.collect()
assert freed == ["Rome"], "the cache must not keep a clip alive once its users let go"
assert len(cache) == 1, f"after the Rome clip was freed, len(cache) should be 1, not {len(cache)}"
assert cache.get("Vikings") is vikings, "the clip still in use should still be shared"
assert cache.get("Rome") is not None and loads == ["Rome", "Vikings", "Rome"], "a freed clip should be loaded again"
gc.collect()

other_loads = []


def other_loader(room):
    other_loads.append(room)
    return Clip(room, 1)


other = ClipCache(other_loader)
from_other = other.get("Vikings")
assert other_loads == ["Vikings"] and from_other is not vikings, (
    "each ClipCache should have its own dictionary: another cache must use its own loader"
)
assert len(cache) == 1 and len(other) == 1, "each cache should count only its own live clips"

del vikings, from_other
gc.collect()
assert len(cache) == 0 and len(other) == 0, "with nothing in use, both caches should be empty"
