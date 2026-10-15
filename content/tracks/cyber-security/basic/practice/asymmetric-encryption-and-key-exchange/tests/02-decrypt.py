# decrypt_tip opens packages built exactly as the instructions describe.
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

RAW = dict(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)
newsroom = X25519PrivateKey.from_private_bytes(bytes(range(32)))


def reference_package(message, ephemeral_bytes, nonce):
    ephemeral = X25519PrivateKey.from_private_bytes(ephemeral_bytes)
    shared = ephemeral.exchange(newsroom.public_key())
    key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"gazette tipline v1").derive(shared)
    return ephemeral.public_key().public_bytes(**RAW) + nonce + AESGCM(key).encrypt(nonce, message.encode("utf-8"), None)


for message, seed in [
    ("Short tip.", 7),
    ("", 9),
    ("Le maire a signé le contrat avant la clôture de l'appel d'offres.", 11),
    ("x" * 5000, 13),
]:
    package = reference_package(message, bytes([seed]) * 32, bytes([seed + 1]) * 12)
    got = decrypt_tip(newsroom, package)
    assert got == message, (
        f"decrypt_tip should open a package of ephemeral public key, nonce and AES-GCM ciphertext "
        f"under the HKDF key ({len(message)}-character message)"
    )
