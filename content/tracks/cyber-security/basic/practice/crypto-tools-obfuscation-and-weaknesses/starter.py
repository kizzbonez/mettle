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
    # YOUR CODE: WEAK-CIPHER, SHORT-KEY, WEAK-HASH, POOR-RANDOMNESS, DOWNGRADE-RISK, HARDCODED-KEY.
    # A field that is missing is not checked: use config.get("cipher") and test for None.
    return findings


def reused_nonces(path):
    """Return the sorted list of (key_id, nonce) pairs that appear more than once in an encryption log."""
    counts = {}                                        # (key_id, nonce) -> how many times it was used
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):                  # each row as a dict: row["key_id"], row["nonce"]
            # YOUR CODE: count the pair, with spaces removed and the nonce in lower case.
            pass
    # YOUR CODE: return the sorted list of pairs counted more than once.
    raise NotImplementedError


if __name__ == "__main__":
    for service in load_services("data/services.json"):
        print(f"{service['name']}: {', '.join(weak_settings(service)) or 'OK'}")
    for key_id, nonce in reused_nonces("data/encrypt.log"):
        print(f"nonce reused: {key_id} {nonce}")
