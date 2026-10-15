Each candidate note is encrypted with **AES-256-GCM** under the key in `data/notes.key` (read by
`load_key`), with the candidate's record ID as **associated data**, as in the lesson. A sealed
note is stored as one text **token**: the nonce in hex, a colon, then the ciphertext (which ends
with the 16-byte tag) in hex, both in lower case. Write three functions in `solution.py`:

1. **`seal(key, record_id, note, nonce=None)`** returns the token for `note` (a `str`). When no
   `nonce` is given, make a new one with `os.urandom(12)`: a nonce must never repeat under the same
   key. Encrypt `note.encode("utf-8")` with `AESGCM(key).encrypt(nonce, data, aad)`, where `aad` is
   `record_id.encode("utf-8")`. The tests pass a fixed nonce only so that the result can be checked.
2. **`open_note(key, record_id, token)`** returns the note as a `str`, or **`None`** when the note
   cannot be trusted. It never raises. Return `None` when:
   - the token does not split at `:` into exactly two parts, or a part is not hex
     (`bytes.fromhex` raises `ValueError`);
   - the nonce is not 12 bytes;
   - decryption raises `InvalidTag`: the nonce, ciphertext or tag was changed, the key is wrong, or
     the token belongs to another record ID.
3. **`tampered(path, key)`** reads a CSV file with the header `record_id,token` and returns the
   list of record IDs whose note `open_note` cannot open, in file order.

**Example.**

```python
key = load_key("data/notes.key")
token = seal(key, "C-2001", "Ready to start in January.", bytes(12))
# '000000000000000000000000:83e31efbc829649346df0d59f1bfbcaa13f42b29fa6ecb97f40de599d11fda1d21b0d4310fbc066ac9b3'
open_note(key, "C-2001", token)     # 'Ready to start in January.'
open_note(key, "C-1041", token)     # None: the record ID is part of what the tag protects
tampered("data/notes.csv", key)     # ['C-1043', 'C-1044', 'C-1046']
```

C-1043 holds a copy of C-1041's token, pasted into another candidate's record; one hex digit of
C-1044's ciphertext was changed; C-1046 was sealed under an old key.

**Tips.** `data.hex()` writes bytes as lower-case hex, and `bytes.fromhex(text)` reads them back.
`token.split(":")` gives the list of parts. Catch an exception with
`try: ... except InvalidTag: return None` (and the same for `ValueError`).
