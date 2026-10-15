"""Check the HMAC tags on payment notifications before the shop marks any order as paid."""
import hashlib
import hmac


def load_key(path):
    """Read the shared webhook key, written in hexadecimal, from a file."""
    with open(path, encoding="utf-8") as f:
        return bytes.fromhex(f.read().strip())


def sign(key, body):
    """Return the header for BODY (bytes): "sha256=" and the HMAC-SHA-256 tag in lower-case hex."""
    return "sha256=" + hmac.new(key, body, hashlib.sha256).hexdigest()


def verify(key, body, header):
    """Return True only if HEADER carries the right HMAC-SHA-256 tag for BODY."""
    if header is None:
        return False
    header = header.strip()
    if not header.startswith("sha256="):
        return False
    received = header[len("sha256="):].lower()
    expected = hmac.new(key, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received)


def audit(path, key):
    """Return [(line number, "OK" or "WEAK" or "FORGED"), ...] for a delivery log."""
    results = []
    with open(path, encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            header, _, body = line.partition(" ")
            if verify(key, body.encode("utf-8"), header):
                status = "OK"
            elif header.startswith("sha1="):
                status = "WEAK"
            else:
                status = "FORGED"
            results.append((number, status))
    return results


if __name__ == "__main__":
    for number, status in audit("data/deliveries.log", load_key("data/webhook-key.txt")):
        print(number, status)
