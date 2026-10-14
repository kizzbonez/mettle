# The example from the instructions.
import gc
import weakref

loads = []


def loader(room):
    loads.append(room)
    return Clip(room, len(room) * 10)


try:
    weakref.ref(Clip("Hall", 5))
except TypeError:
    raise AssertionError("Clip instances should support weak references: add '__weakref__' to __slots__") from None

cache = ClipCache(loader)
egypt = cache.get("Egypt")
again = cache.get("Egypt")
assert again is egypt, "two get('Egypt') calls while the clip is in use should return the same object"
assert loads == ["Egypt"], f"the loader should be called once while the clip is in use; it was called for {loads}"
assert len(cache) == 1, f"len(cache) with one clip in use should be 1, not {len(cache)}"
del egypt, again
gc.collect()
assert len(cache) == 0, "once nobody holds the clip it should be freed, and len(cache) should be 0"
egypt = cache.get("Egypt")
assert loads == ["Egypt", "Egypt"], f"after the clip was freed, get('Egypt') should load it again; loads were {loads}"

total = total_seconds(["Egypt", "Rome", "Vikings"], loader)
assert total == 160, f"total_seconds(['Egypt', 'Rome', 'Vikings'], loader) should be 160, not {total}"

tour = {"title": "Highlights", "stops": [{"room": "Egypt", "minutes": 10}]}
saved = snapshot(tour)
tour["stops"][0]["minutes"] = 25
assert saved["stops"][0]["minutes"] == 10, "a change deep inside the tour should not show in the snapshot"
