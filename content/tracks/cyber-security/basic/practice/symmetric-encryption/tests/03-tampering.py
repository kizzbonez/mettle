# open_note refuses any change to the nonce, ciphertext or tag, another key and another record.
key = bytes.fromhex("3c" * 32)
token = seal(key, "C-55", "Offer: 61k, start 1 March.", bytes.fromhex("a0a1a2a3a4a5a6a7a8a9aaab"))
nonce_hex, ciphertext_hex = token.split(":")


def flip(hex_text, position):
    data = bytearray(bytes.fromhex(hex_text))
    data[position] ^= 0x01
    return data.hex()


assert open_note(key, "C-55", token) == "Offer: 61k, start 1 March.", "the untouched note should open"
cases = {
    "one bit of the nonce flipped": flip(nonce_hex, 0) + ":" + ciphertext_hex,
    "one bit of the ciphertext flipped": nonce_hex + ":" + flip(ciphertext_hex, 3),
    "one bit of the tag flipped": nonce_hex + ":" + flip(ciphertext_hex, len(ciphertext_hex) // 2 - 1),
    "the last byte cut off": nonce_hex + ":" + ciphertext_hex[:-2],
}
for label, changed in cases.items():
    assert open_note(key, "C-55", changed) is None, f"open_note should return None for a token with {label}"
assert open_note(bytes.fromhex("3d" * 32), "C-55", token) is None, "open_note should return None under another key"
assert open_note(key, "C-56", token) is None, "open_note should return None for a token moved to another record"
assert open_note(key, "c-55", token) is None, "the record ID is compared exactly, case included"
