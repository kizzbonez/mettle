# decrypt_tip returns None, without raising, for anything it cannot open.
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

newsroom = X25519PrivateKey.generate()
package = encrypt_tip(newsroom.public_key(), "The quarry is dumping at night.")


def changed(position):
    data = bytearray(package)
    data[position] ^= 0x01
    return bytes(data)


def opened(label, data, key=newsroom):
    try:
        return decrypt_tip(key, data)
    except Exception as error:
        raise AssertionError(f"decrypt_tip should return None, not raise {type(error).__name__}, for {label}")


assert opened("the right key", package) == "The quarry is dumping at night.", "the untouched package should open"
assert opened("another newsroom's key", package, X25519PrivateKey.generate()) is None, "a package for another key should give None"
assert opened("a changed ephemeral public key", changed(5)) is None, "a package with a changed public key should give None"
assert opened("a changed nonce", changed(33)) is None, "a package with a changed nonce should give None"
assert opened("a changed ciphertext", changed(50)) is None, "a package with a changed ciphertext should give None"
assert opened("a changed tag", changed(len(package) - 1)) is None, "a package with a changed tag should give None"
assert opened("a package of 59 bytes", package[:59]) is None, "a package shorter than 60 bytes should give None"
assert opened("an empty package", b"") is None, "an empty package should give None"
assert opened("an all-zero public key", bytes(32) + package[32:]) is None, (
    "a package whose public key makes the exchange fail should give None"
)
