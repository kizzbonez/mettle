"""Passwords, reset tokens and upload paths for the choir's website, done safely."""
import hashlib
import hmac
import secrets
from pathlib import Path

N, R, P = 2**14, 8, 1   # scrypt cost, light enough for the tests


def hash_password(password, salt=None):
    """Return (salt, key) for PASSWORD, with a new random 16-byte salt unless one is given."""
    # YOUR CODE: secrets.token_bytes(16) and hashlib.scrypt(..., n=N, r=R, p=P).
    raise NotImplementedError


def check_password(password, salt, key):
    """Return True when PASSWORD with SALT gives KEY, compared in constant time."""
    # YOUR CODE: hmac.compare_digest.
    raise NotImplementedError


def new_token():
    """Return an unpredictable URL-safe token for a reset link."""
    # YOUR CODE
    raise NotImplementedError


def upload_path(base, name):
    """Return the resolved path of NAME inside the folder BASE; ValueError if it leads out."""
    # YOUR CODE: resolve both, then is_relative_to.
    raise NotImplementedError
