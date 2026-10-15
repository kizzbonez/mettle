# seal: AES-GCM with the record ID as associated data, and a fresh nonce every time.
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = bytes(range(32))
nonce = bytes.fromhex("0102030405060708090a0b0c")
for record_id, note in [("C-7", "Prefers remote interviews."), ("C-8", ""), ("C-9", "Français courant, départ à Lyon.")]:
    token = seal(key, record_id, note, nonce)
    reference = nonce.hex() + ":" + AESGCM(key).encrypt(nonce, note.encode("utf-8"), record_id.encode("utf-8")).hex()
    assert token == reference, (
        f"seal with a given nonce should give NONCEHEX:CIPHERTEXTHEX with the record ID as associated data ({record_id})"
    )
    assert open_note(key, record_id, token) == note, "open_note should give back what seal sealed"

first = seal(key, "C-10", "Same note twice.")
second = seal(key, "C-10", "Same note twice.")
assert first != second, "seal without a nonce must make a new random nonce every time"
for token in (first, second):
    nonce_hex, ciphertext_hex = token.split(":")
    assert len(bytes.fromhex(nonce_hex)) == 12, "seal without a nonce should make a 12-byte nonce"
    assert len(bytes.fromhex(ciphertext_hex)) == len("Same note twice.") + 16, "the ciphertext should carry the 16-byte tag"
    assert token == token.lower(), "the hex in a token should be lower case"
    assert open_note(key, "C-10", token) == "Same note twice.", "a note sealed with a random nonce should open"
