# Ciphers, RSA key sizes and signature hashes.
for cipher in ["aes-256-gcm", "Aes-128-Gcm", "chacha20-poly1305"]:
    assert weak_settings({"name": "s", "cipher": cipher}) == [], "cipher names are compared without regard to case"
for cipher in ["AES-256-ECB", "AES-256-CBC", "AES-128-CTR", "RC4", "DES-CBC", "BLOWFISH"]:
    assert weak_settings({"name": "s", "cipher": cipher}) == ["WEAK-CIPHER"], "any cipher outside the three AEAD ciphers is weak"

assert weak_settings({"name": "s", "rsa_bits": 2048}) == [], "an RSA key of 2048 bits is long enough"
assert weak_settings({"name": "s", "rsa_bits": 2047}) == ["SHORT-KEY"], "an RSA key of 2047 bits is short"
assert weak_settings({"name": "s", "rsa_bits": 512}) == ["SHORT-KEY"], "an RSA key of 512 bits is short"

for digest in ["MD5", "Sha1", "sha1"]:
    assert weak_settings({"name": "s", "signature_hash": digest}) == ["WEAK-HASH"], "MD5 and SHA-1 are weak in any case"
for digest in ["sha256", "SHA384", "sha3-256"]:
    assert weak_settings({"name": "s", "signature_hash": digest}) == [], "SHA-2 and SHA-3 hashes are not weak"

assert weak_settings({"name": "only-a-name"}) == [], "a field that is missing is not checked"
