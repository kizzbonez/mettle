# The example from the instructions.
import hashlib
from pathlib import Path

salt, key = hash_password("Ave verum corpus")
assert isinstance(salt, bytes) and len(salt) == 16, "hash_password without a salt should make a random 16-byte salt"
assert isinstance(key, bytes) and len(key) == 64, "the key from hashlib.scrypt should be 64 bytes"
assert check_password("Ave verum corpus", salt, key) is True, "check_password with the right password should be True"
assert check_password("ave verum corpus", salt, key) is False, "check_password with a different password should be False"

fixed = b"0123456789abcdef"
expected = hashlib.scrypt(b"Ave verum corpus", salt=fixed, n=2**14, r=8, p=1)
assert hash_password("Ave verum corpus", fixed) == (fixed, expected), (
    "hash_password with the salt b'0123456789abcdef' should return (salt, hashlib.scrypt(...)) with N, R and P"
)
assert len(new_token()) == 43, "new_token() should be 43 characters long, like secrets.token_urlsafe(32)"

Path("scores/mozart").mkdir(parents=True, exist_ok=True)
got = upload_path("scores", "mozart/k618.pdf")
assert got == Path("scores/mozart/k618.pdf").resolve(), f"upload_path('scores', 'mozart/k618.pdf') should be the resolved path, not {got!r}"
for name in ["../config/secrets.toml", "/etc/passwd"]:
    try:
        upload_path("scores", name)
    except ValueError:
        continue
    raise AssertionError(f"upload_path('scores', {name!r}) should raise ValueError")
