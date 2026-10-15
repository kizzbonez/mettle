The newsroom publishes its X25519 **public** key (`data/newsroom-public.pem`); only the newsroom
holds the **private** key. For this lab, a **test-only** private key ships in
`data/newsroom-test-key.hex` (its 32 raw bytes in hex, read by `load_private_key`) so that the
sample tip can be opened. A real private key is never kept in a repository: it stays with its
owner, in an HSM, a key management system or a file only the owner can read. A source encrypts a
tip with **hybrid
encryption**, as in the lesson: an ephemeral key exchange makes a shared secret, HKDF turns it into
an AES key, and AES-256-GCM encrypts the message. The starter gives you `public_bytes`,
`derive_key` (HKDF-SHA-256 with `INFO`) and the loaders. Write two functions in `solution.py`:

1. **`encrypt_tip(newsroom_public, message, ephemeral=None, nonce=None)`** returns the package as
   `bytes`:
   - When `ephemeral` is `None`, make a new key pair with `X25519PrivateKey.generate()`; when
     `nonce` is `None`, make one with `os.urandom(12)`. (The tests pass both only to get a result
     they can check. A new ephemeral key for every tip is what gives forward secrecy.)
   - `key = derive_key(ephemeral.exchange(newsroom_public))`.
   - Encrypt `message.encode("utf-8")` with `AESGCM(key).encrypt(nonce, data, None)`.
   - The package is `public_bytes(ephemeral.public_key())` (32 bytes), then the nonce (12 bytes),
     then the ciphertext.
2. **`decrypt_tip(newsroom_private, package)`** returns the message as a `str`, or **`None`** when
   it cannot be opened. It never raises.
   - A package shorter than 60 bytes (32 + 12 + the 16-byte tag) gives `None`.
   - Split it into the sender's public key (`X25519PublicKey.from_public_bytes(package[:32])`),
     the nonce (`package[32:44]`) and the ciphertext (the rest).
   - Derive the key with `newsroom_private.exchange(...)` and `derive_key`, then decrypt. Return
     `None` when decryption raises `InvalidTag` (wrong key or any byte changed) or the exchange
     raises `ValueError` (an unusable public key).

**Example.**

```python
private_key = load_private_key("data/newsroom-test-key.hex")
with open("data/tip-0193.hex") as f:
    package = bytes.fromhex(f.read().strip())
decrypt_tip(private_key, package)
# 'The dredging contract was signed two days before the tender closed. Compare the board minutes of 3 March.'
```

That tip was made with the ephemeral private key
`X25519PrivateKey.from_private_bytes(bytes.fromhex("b0d5e2a9c6f3b8e1d4a7c0f5b2e9d6a3c8f1b4e7d0a5c2f9b6e3d8a1c4f7b0e5"))`
and the nonce `bytes.fromhex("c4a1e7b2d8f305196a2b3c4d")`; `encrypt_tip` with those two must
rebuild the 165 bytes of `data/tip-0193.hex` exactly.
