# check_password: right and wrong passwords and salts, compared with hmac.compare_digest.
import hashlib
import hmac
from unittest import mock

salt = b"choir-salt-16byt"
key = hashlib.scrypt("Lux aeterna".encode(), salt=salt, n=2**14, r=8, p=1)

real_compare = hmac.compare_digest
with mock.patch("hmac.compare_digest", wraps=real_compare) as spy:
    result = check_password("Lux aeterna", salt, key)
assert result is True, "check_password should accept the right password for a stored salt and key"
assert spy.call_count >= 1, "check_password should compare the keys with hmac.compare_digest, not =="

with mock.patch("hmac.compare_digest", wraps=real_compare) as spy:
    result = check_password("Lux aeterna ", salt, key)
assert result is False, "a password with an extra space is a different password"
assert spy.call_count >= 1, "check_password should use hmac.compare_digest for a wrong password too"

assert check_password("Lux aeterna", b"wrong-salt-16byt", key) is False, "the right password with another salt should not match"
assert check_password("", salt, key) is False, "an empty password should not match"
assert check_password("lux aeterna", salt, key) is False, "passwords are case-sensitive"

other_salt, other_key = hash_password("Gloria")
assert check_password("Gloria", other_salt, other_key) is True, "a password should match the key hash_password made for it"
assert check_password("Lux aeterna", other_salt, other_key) is False, "another member's password should not match"
