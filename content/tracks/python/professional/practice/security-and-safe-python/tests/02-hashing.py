# hash_password: the exact scrypt key for fixed salts, UTF-8 passwords, and unpredictable salts.
import hashlib
import random

cases = [
    ("correct horse battery staple", b"salt-for-ada-16b"),
    ("pässwörd ♫", b"\x00" * 16),
    ("", b"another-salt-xyz"),
]
for password, salt in cases:
    expected = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    got = hash_password(password, salt)
    assert isinstance(got, tuple) and len(got) == 2, "hash_password should return a tuple (salt, key)"
    assert got[0] == salt, f"hash_password should return the salt it was given ({password!r})"
    assert got[1] == expected, f"the key for {password!r} should be hashlib.scrypt of its UTF-8 bytes with n=2**14, r=8, p=1"

one = hash_password("same", b"salt-number-one!")[1]
two = hash_password("same", b"salt-number-two!")[1]
assert one != two, "the same password with two different salts should give different keys"

random.seed(2026)
first_salt, first_key = hash_password("hymn")
random.seed(2026)
second_salt, second_key = hash_password("hymn")
assert first_salt != second_salt, "new salts must come from secrets: seeding random should not repeat them"
assert first_key != second_key, "the same password with two new salts should give different keys"
assert len(first_salt) == 16, "a new salt should be 16 bytes"
