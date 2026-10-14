Write a class, a cache class and two functions in `solution.py`.

1. `Clip(room, seconds)` stores its two arguments as the attributes `room` and `seconds`. Give
   it `__slots__`, so instances have no `__dict__` and assigning any other attribute raises
   `AttributeError`. Include `"__weakref__"` among the slots: a class with `__slots__` cannot be
   weakly referenced without it, and the cache below needs weak references.
2. `ClipCache(loader)` shares clips while they are in use. `loader(room)` loads and returns a
   new `Clip`.
   - `get(room)` returns the clip already loaded for `room` if one is still alive, and otherwise
     calls `loader(room)`, remembers the new clip and returns it.
   - The cache must **not** keep clips alive: keep them in a `weakref.WeakValueDictionary`, created
     in `__init__` so that every cache has its own.
   - `len(cache)` (write `__len__`) is the number of clips in the cache that are still alive.
3. `total_seconds(rooms, loader)` returns the sum of `loader(room).seconds` over the iterable
   `rooms`, without keeping the clips: never more than two clips may be alive at once, however
   many rooms there are. A generator expression inside `sum` does it; a list of clips does not.
4. `snapshot(tour)` returns a copy of `tour`, a `dict` of nested lists and dicts, that later
   changes to `tour`, at any depth, do not affect. Use the right function from `copy`.

**How it is judged.** The tests watch your objects with `weakref.finalize` and `weakref.ref`:
CPython frees an object as soon as its last reference goes, so they know exactly how many clips
are alive. They also check `__slots__` by looking for `__dict__`, and identities with `is`.

**Example.**

```python
loads = []


def loader(room):
    loads.append(room)
    return Clip(room, len(room) * 10)


cache = ClipCache(loader)
egypt = cache.get("Egypt")
again = cache.get("Egypt")
print(again is egypt, loads, len(cache))   # True ['Egypt'] 1
del egypt, again
print(len(cache))                          # 0: nobody holds the clip, so it was freed
egypt = cache.get("Egypt")
print(loads)                               # ['Egypt', 'Egypt']: loaded again

total_seconds(["Egypt", "Rome", "Vikings"], loader)   # 160

tour = {"title": "Highlights", "stops": [{"room": "Egypt", "minutes": 10}]}
saved = snapshot(tour)
tour["stops"][0]["minutes"] = 25
print(saved["stops"][0]["minutes"])        # 10
```

Run the example as a script: the interactive shell keeps the last value shown in `_`, which is a
reference too.
