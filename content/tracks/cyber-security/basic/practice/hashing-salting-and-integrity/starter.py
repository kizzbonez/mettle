"""Check the HMAC tags on payment notifications before the shop marks any order as paid."""
import hashlib
import hmac


def load_key(path):
    """Read the shared webhook key, written in hexadecimal, from a file."""
    with open(path, encoding="utf-8") as f:
        return bytes.fromhex(f.read().strip())


def sign(key, body):
    """Return the header for BODY (bytes): "sha256=" and the HMAC-SHA-256 tag in lower-case hex."""
    # YOUR CODE: hmac.new(key, body, hashlib.sha256).hexdigest()
    raise NotImplementedError


def verify(key, body, header):
    """Return True only if HEADER carries the right HMAC-SHA-256 tag for BODY."""
    # YOUR CODE: the rules are in the instructions. Compare with hmac.compare_digest, never ==.
    raise NotImplementedError


def audit(path, key):
    """Return [(line number, "OK" or "WEAK" or "FORGED"), ...] for a delivery log."""
    results = []
    with open(path, encoding="utf-8") as f:            # open the file for reading as text
        for number, line in enumerate(f, start=1):     # each line, numbered from 1
            line = line.rstrip("\n")                   # remove only the line ending
            # YOUR CODE: skip blank lines and comments; split the line into header and body at
            # the first space; append (number, status) to results.
            pass
    return results


if __name__ == "__main__":
    for number, status in audit("data/deliveries.log", load_key("data/webhook-key.txt")):
        print(number, status)
