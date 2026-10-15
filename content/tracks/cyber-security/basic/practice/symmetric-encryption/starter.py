"""Seal candidate notes with AES-256-GCM, bound to their record ID, and find notes that were altered."""
import csv
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def load_key(path):
    """Read the 32-byte AES key, written in hexadecimal. (In production it would come from a KMS.)"""
    with open(path, encoding="utf-8") as f:
        return bytes.fromhex(f.read().strip())


def seal(key, record_id, note, nonce=None):
    """Encrypt NOTE (str) for RECORD_ID and return "NONCEHEX:CIPHERTEXTHEX"."""
    # YOUR CODE: a new 12-byte nonce from os.urandom when none is given; the record ID,
    # encoded as UTF-8, is the associated data.
    raise NotImplementedError


def open_note(key, record_id, token):
    """Return the note sealed in TOKEN for RECORD_ID, or None if it cannot be trusted."""
    # YOUR CODE: split the token, check it, decrypt; return None instead of raising.
    raise NotImplementedError


def tampered(path, key):
    """Return the record IDs in a notes CSV (record_id,token) whose notes cannot be opened."""
    bad = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):                  # each row as a dict: row["record_id"], row["token"]
            # YOUR CODE: append the record ID when open_note cannot open its token.
            pass
    return bad


if __name__ == "__main__":
    key = load_key("data/notes.key")
    print("cannot open:", ", ".join(tampered("data/notes.csv", key)))
