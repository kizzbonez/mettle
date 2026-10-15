The payment provider and the shop share a secret key (`data/webhook-key.txt`, read by
`load_key`). With every notification the provider sends a header holding an **HMAC-SHA-256** tag of
the body, as in the lesson. Write three functions in `solution.py`:

1. **`sign(key, body)`** (`body` is `bytes`) returns the header text: `sha256=` followed by
   `hmac.new(key, body, hashlib.sha256).hexdigest()`.
2. **`verify(key, body, header)`** returns `True` only when the header is right for this body:
   - `None` or an empty header is `False`. Remove spaces and line endings around the header.
   - It must start with `sha256=`. Anything else is `False`, even a correct `sha1=` tag: SHA-1 is
     broken for security, so the shop never accepts it.
   - The rest is the tag in hex, upper or lower case. Lower-case it and compare it with the tag
     you compute using **`hmac.compare_digest`**, never `==`. The tests check that you call
     `hmac.compare_digest`.
3. **`audit(path, key)`** checks a delivery log and returns a list of `(line number, status)`
   tuples. Number the lines from 1, counting every line. Skip blank lines (also lines of only
   spaces) and lines starting with `#`. Remove only the line ending (`line.rstrip("\n")`), then
   split at the **first** space: the header comes before it, and the body is everything after it,
   spaces included, encoded as UTF-8. The status is:
   - `OK` when `verify` accepts the line;
   - `WEAK` when the header starts with `sha1=`;
   - `FORGED` otherwise.

**Example.**

```python
key = load_key("data/webhook-key.txt")
sign(key, b'{"event": "ping"}')
# 'sha256=209c7fd72598b2bd798fb14d4f1d2478208e106b2154611444f521f178f9e2bf'
audit("data/deliveries.log", key)
# [(2, 'OK'), (3, 'OK'), (4, 'FORGED'), (6, 'WEAK'), (7, 'OK'), (8, 'FORGED')]
```

Line 4 claims a refund of 1249.00, but its tag was made for 12.49; line 8's tag was made with
another key. Neither may change an order.

**Tip.** `header, _, body = line.partition(" ")` splits at the first space.
