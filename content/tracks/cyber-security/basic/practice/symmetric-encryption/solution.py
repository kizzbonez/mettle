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
    if nonce is None:
        nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, note.encode("utf-8"), record_id.encode("utf-8"))
    return nonce.hex() + ":" + ciphertext.hex()


def open_note(key, record_id, token):
    """Return the note sealed in TOKEN for RECORD_ID, or None if it cannot be trusted."""
    parts = token.split(":")
    if len(parts) != 2:
        return None
    try:
        nonce = bytes.fromhex(parts[0])
        ciphertext = bytes.fromhex(parts[1])
    except ValueError:
        return None
    if len(nonce) != 12:
        return None
    try:
        plaintext = AESGCM(key).decrypt(nonce, ciphertext, record_id.encode("utf-8"))
    except InvalidTag:
        return None
    return plaintext.decode("utf-8")


def tampered(path, key):
    """Return the record IDs in a notes CSV (record_id,token) whose notes cannot be opened."""
    bad = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if open_note(key, row["record_id"], row["token"]) is None:
                bad.append(row["record_id"])
    return bad


if __name__ == "__main__":
    key = load_key("data/notes.key")
    print("cannot open:", ", ".join(tampered("data/notes.csv", key)))
