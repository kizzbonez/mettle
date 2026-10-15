"""The newsroom tip line: hybrid encryption with an ephemeral X25519 key exchange and AES-256-GCM.

A package is: the sender's ephemeral public key (32 bytes) + nonce (12 bytes) + AES-GCM ciphertext.
The helpers are written. Write encrypt_tip and decrypt_tip (YOUR CODE).
"""
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

INFO = b"gazette tipline v1"   # binds the derived key to this one purpose


def load_private_key(path):
    """Load an X25519 private key from a file holding its 32 raw bytes in hex.

    For this lab only: the test key ships with the lab. Real private keys never go in a
    repository; they stay with their owner (an HSM, a key management system, or a protected file).
    """
    with open(path, encoding="utf-8") as f:
        return X25519PrivateKey.from_private_bytes(bytes.fromhex(f.read().strip()))


def load_public_key(path):
    """Load an X25519 public key from a PEM file."""
    with open(path, "rb") as f:
        return serialization.load_pem_public_key(f.read())


def public_bytes(public_key):
    """Return the 32 raw bytes of an X25519 public key."""
    return public_key.public_bytes(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)


def derive_key(shared_secret):
    """Turn the raw X25519 shared secret into a 32-byte AES key with HKDF-SHA-256."""
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=INFO).derive(shared_secret)


def encrypt_tip(newsroom_public, message, ephemeral=None, nonce=None):
    """Encrypt MESSAGE (str) so that only the holder of the newsroom's private key can read it."""
    if ephemeral is None:
        ephemeral = X25519PrivateKey.generate()
    if nonce is None:
        nonce = os.urandom(12)
    key = derive_key(ephemeral.exchange(newsroom_public))
    ciphertext = AESGCM(key).encrypt(nonce, message.encode("utf-8"), None)
    return public_bytes(ephemeral.public_key()) + nonce + ciphertext


def decrypt_tip(newsroom_private, package):
    """Return the message in PACKAGE (bytes), or None if it cannot be opened."""
    if len(package) < 32 + 12 + 16:
        return None
    sender_public = X25519PublicKey.from_public_bytes(package[:32])
    nonce = package[32:44]
    ciphertext = package[44:]
    try:
        key = derive_key(newsroom_private.exchange(sender_public))
        return AESGCM(key).decrypt(nonce, ciphertext, None).decode("utf-8")
    except (InvalidTag, ValueError):
        return None


if __name__ == "__main__":
    private_key = load_private_key("data/newsroom-test-key.hex")
    with open("data/tip-0193.hex", encoding="utf-8") as f:
        print(decrypt_tip(private_key, bytes.fromhex(f.read().strip())))
