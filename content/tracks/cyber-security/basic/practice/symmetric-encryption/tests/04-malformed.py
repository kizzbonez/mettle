# Malformed tokens give None instead of an exception, and a CSV of them is reported in order.
key = bytes.fromhex("5a" * 32)
good = seal(key, "C-90", "Holds a forklift licence.", bytes.fromhex("0f" * 12))
nonce_hex, ciphertext_hex = good.split(":")

malformed = {
    "an empty token": "",
    "a token without a colon": nonce_hex + ciphertext_hex,
    "a token with three parts": nonce_hex + ":" + ciphertext_hex + ":00",
    "a token that is not hex": "zz" * 12 + ":" + ciphertext_hex,
    "a 16-byte nonce": "0f" * 16 + ":" + ciphertext_hex,
    "an 8-byte nonce": "0f" * 8 + ":" + ciphertext_hex,
    "an empty ciphertext": nonce_hex + ":",
}
for label, token in malformed.items():
    try:
        result = open_note(key, "C-90", token)
    except Exception as error:
        raise AssertionError(f"open_note should return None, not raise {type(error).__name__}, for {label}")
    assert result is None, f"open_note should return None for {label}"

with open("t4-notes.csv", "w", encoding="utf-8") as f:
    f.write("record_id,token\n")
    f.write(f"C-91,{seal(key, 'C-91', 'Fine.')}\n")
    f.write("C-92,not-a-token\n")
    f.write(f"C-93,{good}\n")
    f.write(f"C-90,{good}\n")
assert tampered("t4-notes.csv", key) == ["C-92", "C-93"], "tampered should list, in file order, every record whose note does not open"

with open("t4-empty.csv", "w", encoding="utf-8") as f:
    f.write("record_id,token\n")
assert tampered("t4-empty.csv", key) == [], "a notes file with no rows has nothing tampered"
