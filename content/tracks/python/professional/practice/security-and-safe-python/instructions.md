Write four functions in `solution.py`. The starter sets the scrypt cost to `N, R, P = 2**14, 8, 1`,
lighter than the lesson's so the tests run quickly; use these constants.

1. `hash_password(password, salt=None)` returns the tuple `(salt, key)`. When no `salt` is
   given, make a new random one with `secrets.token_bytes(16)`. The key is
   `hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P)`, 64 bytes.
2. `check_password(password, salt, key)` returns `True` when `password` hashed with `salt` gives
   `key`, and `False` otherwise. Compare with `hmac.compare_digest`, never `==`. The tests watch
   `hmac.compare_digest`, so write `import hmac` and call it as `hmac.compare_digest(...)`.
3. `new_token()` returns a fresh token for a password-reset link: `secrets.token_urlsafe(32)`,
   43 characters from `A` to `Z`, `a` to `z`, `0` to `9`, `-` and `_`. Never use `random`, whose
   output can be predicted: the tests seed `random` and check that the tokens do not repeat.
4. `upload_path(base, name)` returns where an uploaded file called `name` may be stored inside
   the folder `base` (a `str` or a `Path`): the **resolved** `Path` of `base / name`. Raise
   `ValueError` when that path is not inside the resolved `base`, which catches `..`, absolute
   names and symbolic links that lead out. Use `Path.is_relative_to`: comparing the paths as
   strings would accept `uploads-old/x` as inside `uploads`.

**Example.**

```python
salt, key = hash_password("Ave verum corpus")
len(salt), len(key)                               # (16, 64)
check_password("Ave verum corpus", salt, key)     # True
check_password("ave verum corpus", salt, key)     # False
hash_password("Ave verum corpus", b"0123456789abcdef")[1] == hashlib.scrypt(
    b"Ave verum corpus", salt=b"0123456789abcdef", n=2**14, r=8, p=1)   # True
len(new_token())                                  # 43

upload_path("scores", "mozart/k618.pdf")          # PosixPath('/srv/choir/scores/mozart/k618.pdf')
upload_path("scores", "../config/secrets.toml")   # ValueError
upload_path("scores", "/etc/passwd")              # ValueError
```

The resolved paths start with whatever folder the program runs in; `/srv/choir` is only an
example.
