Write two functions in `solution.py`, using the constants in the starter.

1. `cookie_findings(value)` takes the value of one `Set-Cookie` header (the text after
   `Set-Cookie: `) and returns the list of problems, in this order (empty when there are none):
   - The parts are separated by `;`; remove the spaces around each. The first part is
     `name=value` (the name is the text before its first `=`). The others are attributes, either
     a bare name (`Secure`) or `Name=value` (`Max-Age=3600`); **attribute names are matched
     ignoring case**, and so is the value of `SameSite`.
   - `no-secure`: there is no `Secure` attribute.
   - `no-httponly`: there is no `HttpOnly` attribute.
   - `samesite`: `SameSite` is missing, or its value is neither `Lax` nor `Strict`.
   - `no-host-prefix` when the name does not start with `__Host-` (written exactly so);
     otherwise `bad-host-prefix` when the cookie has a `Domain` attribute or its `Path` is not
     exactly `/` (missing counts as not `/`), so a browser would refuse it.
   - `long-lived`: `Max-Age` is greater than `MAX_AGE` (28800 seconds, eight hours). A cookie
     without `Max-Age` is not long-lived.
2. `validate_booking(form)` takes the submitted form as a dict of strings (a missing field counts
   as `""`) and returns the clean booking, or raises `ValueError` if **any** field is wrong. It
   never repairs a value. Remove surrounding whitespace from every field first, then:
   - `card`: `FB` followed by exactly 8 digits `0` to `9`. Only these ASCII digits: `\d` and
     `int()` also accept digits of other scripts, such as `٣`.
   - `room`: in lower case, one of `ROOMS`.
   - `day`: written exactly `YYYY-MM-DD` (`date.fromisoformat` alone also accepts `20261103`),
     a real date, from `FIRST_DAY` to `LAST_DAY` inclusive.
   - `hours`: one digit from `1` to `4`.
   - `name`: 1 to 60 characters, each a letter (`str.isalpha()`), a space, a hyphen or an
     apostrophe.

   It returns `{"card": ..., "room": ..., "day": <date>, "hours": <int>, "name": ...}` with the
   cleaned values (the room in lower case).

**Example.** The four cookies in `data/staging-headers.txt`:

```python
cookie_findings("__Host-fb_session=Yq8vT2mWc4LrX0sJ; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600")
# []
cookie_findings("fb_staff=Kd93nQ0zPa71; Path=/staff; HttpOnly; SameSite=None; Max-Age=604800")
# ['no-secure', 'samesite', 'no-host-prefix', 'long-lived']
cookie_findings("__Host-fb_basket=tm4C0q2V; Domain=fernbrook-library.example; Path=/; secure; httponly; samesite=strict")
# ['bad-host-prefix']
cookie_findings("fb_lang=en; Path=/")
# ['no-secure', 'no-httponly', 'samesite', 'no-host-prefix']
```

And the form:

```python
validate_booking({"card": " FB00412977 ", "room": "Studio", "day": "2026-11-03",
                  "hours": "2", "name": "Siobhán O'Neill"})
# {'card': 'FB00412977', 'room': 'studio', 'day': datetime.date(2026, 11, 3),
#  'hours': 2, 'name': "Siobhán O'Neill"}
validate_booking({..., "card": "FB0041' OR '1'='1"})   # ValueError
validate_booking({..., "day": "2027-02-01"})             # ValueError: after LAST_DAY
validate_booking({..., "hours": "4.5"})                  # ValueError
```

**Tip.** `re.fullmatch(r"FB[0-9]{8}", card)` matches the whole string or returns `None`.
