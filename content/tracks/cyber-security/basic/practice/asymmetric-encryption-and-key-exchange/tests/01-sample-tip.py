# The example from the instructions.
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

newsroom_private = load_private_key("data/newsroom-test-key.hex")
newsroom_public = load_public_key("data/newsroom-public.pem")
assert public_bytes(newsroom_private.public_key()) == public_bytes(newsroom_public), (
    "load_private_key should read data/newsroom-test-key.hex as the private half of data/newsroom-public.pem"
)
with open("data/tip-0193.hex", encoding="utf-8") as f:
    package = bytes.fromhex(f.read().strip())

message = "The dredging contract was signed two days before the tender closed. Compare the board minutes of 3 March."
got = decrypt_tip(newsroom_private, package)
assert got == message, f"decrypt_tip on data/tip-0193.hex with the newsroom's private key: got {got!r}"

ephemeral = X25519PrivateKey.from_private_bytes(bytes.fromhex("b0d5e2a9c6f3b8e1d4a7c0f5b2e9d6a3c8f1b4e7d0a5c2f9b6e3d8a1c4f7b0e5"))
rebuilt = encrypt_tip(newsroom_public, message, ephemeral, bytes.fromhex("c4a1e7b2d8f305196a2b3c4d"))
assert isinstance(rebuilt, bytes), "encrypt_tip should return bytes"
assert rebuilt == package, "encrypt_tip with the example's ephemeral key and nonce should rebuild data/tip-0193.hex exactly"

fresh = encrypt_tip(newsroom_public, "Meet at the ferry terminal, 7 pm.")
assert decrypt_tip(newsroom_private, fresh) == "Meet at the ferry terminal, 7 pm.", "a tip encrypted with fresh values should decrypt"
