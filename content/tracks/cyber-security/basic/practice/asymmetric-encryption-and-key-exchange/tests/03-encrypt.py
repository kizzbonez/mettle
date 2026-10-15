# encrypt_tip: the package layout, and fresh ephemeral keys and nonces for every tip.
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

RAW = dict(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)
newsroom = X25519PrivateKey.generate()
newsroom_raw = newsroom.public_key().public_bytes(**RAW)


def reference_open(package):
    sender = X25519PublicKey.from_public_bytes(package[:32])
    key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"gazette tipline v1").derive(newsroom.exchange(sender))
    return AESGCM(key).decrypt(package[32:44], package[44:], None).decode("utf-8")


message = "Invoices for the bridge repair were paid twice in June."
first = encrypt_tip(newsroom.public_key(), message)
second = encrypt_tip(newsroom.public_key(), message)
for package in (first, second):
    assert len(package) == 32 + 12 + len(message.encode("utf-8")) + 16, (
        "a package should be 32 bytes of public key, 12 of nonce, then the ciphertext with its 16-byte tag"
    )
    assert package[:32] != newsroom_raw, "the package should start with the sender's ephemeral public key, not the newsroom's"
    assert reference_open(package) == message, "the package should open with the exchange, HKDF with INFO and AES-GCM"
assert first[:32] != second[:32], "every tip needs a new ephemeral key pair (forward secrecy)"
assert first[32:44] != second[32:44], "every tip needs a new random nonce"

ephemeral = X25519PrivateKey.from_private_bytes(bytes.fromhex("11" * 32))
fixed = encrypt_tip(newsroom.public_key(), "¡Hola!", ephemeral, bytes.fromhex("22" * 12))
assert fixed[:32] == ephemeral.public_key().public_bytes(**RAW), "with a given ephemeral key, the package starts with its public key"
assert fixed[32:44] == bytes.fromhex("22" * 12), "with a given nonce, the package carries that nonce"
assert reference_open(fixed) == "¡Hola!", "the message should be encoded as UTF-8"
