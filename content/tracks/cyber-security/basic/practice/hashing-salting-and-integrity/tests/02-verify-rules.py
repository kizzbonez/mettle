# verify: constant-time comparison, tampering, wrong keys, weak and malformed headers.
import hashlib
import hmac
from unittest import mock

key = bytes.fromhex("6a1f0c9e2b7d4a3f8e5c1b0d9a6f2e7c4b8d1a5e3f0c7b2d9e6a4f1c8b5d2e0a")
body = b'{"event": "payment.succeeded", "order": "SC-30001", "amount": "45.00"}'
tag = hmac.new(key, body, hashlib.sha256).hexdigest()

real_compare = hmac.compare_digest
with mock.patch("hmac.compare_digest", wraps=real_compare) as spy:
    result = verify(key, body, "sha256=" + tag)
assert result is True, "verify should accept a correct sha256= header"
assert spy.call_count >= 1, "verify should compare tags with hmac.compare_digest, not =="

with mock.patch("hmac.compare_digest", wraps=real_compare) as spy:
    result = verify(key, body, "sha256=" + "0" * 64)
assert result is False, "verify should refuse a wrong tag"
assert spy.call_count >= 1, "verify should use hmac.compare_digest for a wrong tag too"

assert verify(key, body.replace(b"45.00", b"4500.00"), "sha256=" + tag) is False, "a changed body must fail verification"
assert verify(b"guessed-key", body, "sha256=" + tag) is False, "a tag checked with another key must fail"
assert verify(key, body, "sha256=" + tag.upper()) is True, "the hex tag may be in upper case"
assert verify(key, body, "  sha256=" + tag + "\r\n") is True, "spaces and a line ending around the header are ignored"

sha1_tag = hmac.new(key, body, hashlib.sha1).hexdigest()
assert verify(key, body, "sha1=" + sha1_tag) is False, "a correct HMAC-SHA-1 header is still refused: only sha256= is accepted"
assert verify(key, body, tag) is False, "a header without the sha256= prefix is refused"
assert verify(key, body, "sha256=") is False, "a header with an empty tag is refused"
assert verify(key, body, "") is False, "an empty header is refused"
assert verify(key, body, None) is False, "a missing header (None) is refused"
