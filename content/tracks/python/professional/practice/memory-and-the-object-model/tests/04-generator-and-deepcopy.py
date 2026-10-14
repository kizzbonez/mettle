# total_seconds keeps at most two clips alive; snapshot is independent at every depth.
import weakref

alive = 0
peak = 0


def released():
    global alive
    alive -= 1


def loader(room):
    global alive, peak
    clip = Clip(room, len(room))
    alive += 1
    peak = max(peak, alive)
    weakref.finalize(clip, released)
    return clip


rooms = [f"room {n}" for n in range(1000)]
total = total_seconds(rooms, loader)
assert total == sum(len(room) for room in rooms), "total_seconds should add up the seconds of every clip"
assert peak <= 2, f"total_seconds should not keep the clips: at most 2 may be alive at once, but {peak} were"

assert total_seconds([], loader) == 0, "total_seconds with no rooms should be 0"
assert total_seconds((name for name in ["Égypte", "Rome"]), loader) == 10, "rooms may be any iterable, such as a generator"

tour = {
    "title": "Highlights",
    "stops": [
        {"room": "Egypt", "minutes": 10, "tags": ["mummies", "papyrus"]},
        {"room": "Rome", "minutes": 15, "tags": ["coins"]},
    ],
    "guide": {"languages": ["en", "pt"]},
}
saved = snapshot(tour)
assert saved == tour, "the snapshot should start equal to the tour"
assert saved is not tour, "the snapshot should be a new dict"
assert saved["stops"] is not tour["stops"] and saved["stops"][0] is not tour["stops"][0], (
    "the snapshot should not share the inner list or its dicts with the tour"
)
tour["title"] = "Changed"
tour["stops"][0]["tags"].append("cats")
tour["stops"][1]["minutes"] = 99
tour["stops"].append({"room": "Vikings", "minutes": 5, "tags": []})
tour["guide"]["languages"].remove("pt")
assert saved == {
    "title": "Highlights",
    "stops": [
        {"room": "Egypt", "minutes": 10, "tags": ["mummies", "papyrus"]},
        {"room": "Rome", "minutes": 15, "tags": ["coins"]},
    ],
    "guide": {"languages": ["en", "pt"]},
}, "changes to the tour at any depth should not show in the snapshot"
assert snapshot({}) == {}, "the snapshot of an empty tour is an empty dict"
