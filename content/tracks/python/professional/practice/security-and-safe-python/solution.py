"""Passwords, reset tokens and upload paths for the choir's website, done safely."""
import hashlib
import hmac
import secrets
from pathlib import Path

N, R, P = 2**14, 8, 1   # scrypt cost, light enough for the tests


def hash_password(password, salt=None):
    """Return (salt, key) for PASSWORD, with a new random 16-byte salt unless one is given."""
    if salt is None:
        salt = secrets.token_bytes(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P)
    return salt, key


def check_password(password, salt, key):
    """Return True when PASSWORD with SALT gives KEY, compared in constant time."""
    _, candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, key)


def new_token():
    """Return an unpredictable URL-safe token for a reset link."""
    return secrets.token_urlsafe(32)


def upload_path(base, name):
    """Return the resolved path of NAME inside the folder BASE; ValueError if it leads out."""
    folder = Path(base).resolve()
    target = (folder / name).resolve()
    if not target.is_relative_to(folder):
        raise ValueError(f"{name!r} is outside the upload folder")
    return target
