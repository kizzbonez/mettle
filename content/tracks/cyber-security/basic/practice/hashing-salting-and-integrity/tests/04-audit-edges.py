# audit: comments, blank lines, bodies with spaces, missing bodies and an empty log.
import hashlib
import hmac

key = b"t4-webhook-key"


def tag(body, algorithm=hashlib.sha256):
    return hmac.new(key, body.encode(), algorithm).hexdigest()


padded = '{"event": "ping"}   '
lines = [
    "   ",
    "# provider retries below",
    "sha256=" + tag(padded) + " " + padded,
    "sha256=" + tag("") + " ",
    "-" + " " + '{"event": "payment.succeeded"}',
    "sha1=" + tag("{}", hashlib.sha1) + " {}",
    "sha256=" + tag('{"a": 1}') + ' {"a": 2}',
]
with open("t4-deliveries.log", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

results = audit("t4-deliveries.log", key)
assert [number for number, _ in results] == [3, 4, 5, 6, 7], (
    "audit should skip blank lines (even of spaces) and # comments, and number lines from 1 counting every line"
)
statuses = dict(results)
assert statuses[3] == "OK", "the body is everything after the first space, trailing spaces included"
assert statuses[4] == "OK", "a line whose body is empty is checked against the tag of an empty body"
assert statuses[5] == "FORGED", "a line whose header is not a tag is FORGED"
assert statuses[6] == "WEAK", "a sha1= header is WEAK"
assert statuses[7] == "FORGED", "a sha256= tag that does not match the body is FORGED"

with open("t4-empty.log", "w", encoding="utf-8") as f:
    f.write("")
assert audit("t4-empty.log", key) == [], "an empty log gives an empty list"
