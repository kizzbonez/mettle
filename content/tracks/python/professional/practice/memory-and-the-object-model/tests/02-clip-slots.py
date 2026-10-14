# Clip: slots instead of a __dict__, weak references, and freed as soon as the last reference goes.
import weakref

clip = Clip("Ägypten", 95)
assert (clip.room, clip.seconds) == ("Ägypten", 95), "Clip(room, seconds) should store room and seconds"
assert "__slots__" in vars(Clip), "Clip should define __slots__"
assert not hasattr(clip, "__dict__"), "a Clip instance should have no __dict__, because Clip has __slots__"
assert "__weakref__" in Clip.__slots__, "Clip.__slots__ should include '__weakref__'"
for slot in ["room", "seconds"]:
    assert slot in Clip.__slots__, f"Clip.__slots__ should include {slot!r}"

try:
    clip.volume = 11
except AttributeError:
    pass
else:
    raise AssertionError("assigning an attribute that is not a slot should raise AttributeError")

clip.seconds = 120
assert clip.seconds == 120, "the slots should still be assignable"

ref = weakref.ref(clip)
assert ref() is clip, "a weak reference to a Clip should give the clip back while it is alive"
freed = []
weakref.finalize(clip, freed.append, "freed")
del clip
assert freed == ["freed"] and ref() is None, "a Clip with no references left should be freed at once"
