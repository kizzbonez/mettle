# sign: an HMAC-SHA-256 tag in lower-case hex after "sha256=".
import hashlib
import hmac

key = b"spoke-and-chain-test-key-0001"
for body in [b"", b'{"event": "payment.failed"}', "{\"note\": \"Fahrrad für Jürgen\"}".encode("utf-8")]:
    header = sign(key, body)
    assert isinstance(header, str), "sign should return a str"
    assert header == "sha256=" + hmac.new(key, body, hashlib.sha256).hexdigest(), (
        f"sign should give sha256= and the lower-case HMAC-SHA-256 hex tag (body of {len(body)} bytes)"
    )
    assert verify(key, body, header) is True, "verify should accept what sign produces"

assert sign(key, b"a") != sign(key + b"!", b"a"), "the tag depends on the key"
assert sign(key, b"a") != sign(key, b"a "), "the tag depends on every byte of the body"
