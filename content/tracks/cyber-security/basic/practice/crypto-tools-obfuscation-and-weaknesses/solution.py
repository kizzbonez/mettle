"""A weak-crypto review: risky settings in service configurations, and nonces reused under one key."""
import csv
import json

GOOD_CIPHERS = {"AES-128-GCM", "AES-256-GCM", "CHACHA20-POLY1305"}
WEAK_HASHES = {"md5", "sha1"}
GOOD_TOKEN_SOURCES = {"secrets", "os.urandom"}
OLD_TLS = {"SSLv3", "TLSv1", "TLSv1.1"}


def load_services(path):
    """Return the list of service configurations (dicts) in a JSON file."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def weak_settings(config):
    """Return the finding codes for one service configuration, in the order of the instructions."""
    findings = []
    cipher = config.get("cipher")
    if cipher is not None and cipher.upper() not in GOOD_CIPHERS:
        findings.append("WEAK-CIPHER")
    bits = config.get("rsa_bits")
    if bits is not None and bits < 2048:
        findings.append("SHORT-KEY")
    digest = config.get("signature_hash")
    if digest is not None and digest.lower() in WEAK_HASHES:
        findings.append("WEAK-HASH")
    source = config.get("token_source")
    if source is not None and source not in GOOD_TOKEN_SOURCES:
        findings.append("POOR-RANDOMNESS")
    versions = config.get("tls_versions")
    if versions is not None and any(version in OLD_TLS for version in versions):
        findings.append("DOWNGRADE-RISK")
    if config.get("key"):
        findings.append("HARDCODED-KEY")
    return findings


def reused_nonces(path):
    """Return the sorted list of (key_id, nonce) pairs that appear more than once in an encryption log."""
    counts = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pair = (row["key_id"].strip(), row["nonce"].strip().lower())
            counts[pair] = counts.get(pair, 0) + 1
    return sorted(pair for pair, count in counts.items() if count > 1)


if __name__ == "__main__":
    for service in load_services("data/services.json"):
        print(f"{service['name']}: {', '.join(weak_settings(service)) or 'OK'}")
    for key_id, nonce in reused_nonces("data/encrypt.log"):
        print(f"nonce reused: {key_id} {nonce}")
