Fix two functions in `solution.py` and write a third. The tests send well-known attack probes
to **your** functions, and also check that ordinary use still works.

1. `find_bookings(db, performance, surname)` returns the list of `(ref, seat)` tuples of the
   bookings in the table `bookings(ref, performance, surname, seat)` whose `performance` and
   `surname` equal the arguments, ordered by `ref`. The starter pastes the values into the SQL
   text, so a surname such as `' OR '1'='1` returns every booking, and `O'Brien` crashes it.
   Make **one** call `db.execute(sql, params)` with `?` placeholders in `sql` and the values in
   the tuple `params`; the tests record what you pass and check that the values never appear in
   the SQL text.
2. `read_upload(path)` returns the text (UTF-8) of an uploaded seating plan, but must refuse a
   symbolic link, which could point at a secret. The starter checks for a link and then reads
   the file by name: another process can swap the file for a link in between (a
   time-of-check/time-of-use race). Open it with `os.open(path, os.O_RDONLY | os.O_NOFOLLOW)`,
   so the check happens in the same step as the use, and read from that descriptor
   (`os.fdopen(fd, encoding="utf-8")`). Let the `OSError` raised for a link propagate.
3. `accept_request(request, seen, now, window=300)` guards the payment requests the box office
   tills send, which an attacker on the network could capture and send again (replay). A request
   is a dict with a `"nonce"` (a non-empty `str`, used once) and a `"timestamp"` (an `int`,
   seconds since 1970). `seen` is the `set` of nonces already accepted and `now` the current time
   in seconds.
   - Return `False` when the nonce is in `seen`, or when `timestamp` is more than `window`
     seconds before or after `now`.
   - **Fail closed**: return `False`, never raise, when `request` is not a dict or a field is
     missing or of the wrong type.
   - Otherwise add the nonce to `seen` and return `True`. Only accepted nonces are added.

**Example.**

```python
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE bookings (ref TEXT, performance TEXT, surname TEXT, seat TEXT)")
db.executemany("INSERT INTO bookings VALUES (?, ?, ?, ?)", [
    ("LT-1002", "2026-10-24 19:30", "Okafor", "C12"),
    ("LT-1001", "2026-10-24 19:30", "Okafor", "C11"),
    ("LT-1007", "2026-10-24 19:30", "O'Brien", "F3"),
    ("LT-1010", "2026-10-25 14:00", "Okafor", "A1"),
])
find_bookings(db, "2026-10-24 19:30", "Okafor")        # [('LT-1001', 'C11'), ('LT-1002', 'C12')]
find_bookings(db, "2026-10-24 19:30", "O'Brien")       # [('LT-1007', 'F3')]
find_bookings(db, "2026-10-24 19:30", "' OR '1'='1")   # []

read_upload("plan.txt")       # 'Stalls: rows A to M\n'   (plan.txt is a regular file)
read_upload("link.txt")       # OSError                  (link.txt is a symbolic link)

seen = set()
accept_request({"nonce": "a91f", "timestamp": 1792137600}, seen, now=1792137630)   # True
accept_request({"nonce": "a91f", "timestamp": 1792137600}, seen, now=1792137640)   # False: replay
accept_request({"nonce": "b22c", "timestamp": 1792137000}, seen, now=1792137640)   # False: too old
accept_request({"nonce": "c37d"}, seen, now=1792137640)                             # False
seen                                                                                # {'a91f'}
```
