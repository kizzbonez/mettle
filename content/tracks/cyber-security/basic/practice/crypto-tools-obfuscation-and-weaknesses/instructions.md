Write two functions in `solution.py`, using the sets the starter defines.

1. **`weak_settings(config)`** takes one service configuration from `data/services.json` (a dict)
   and returns the list of codes that apply, **in this order**. A field that is missing is not
   checked.
   - `WEAK-CIPHER`: `cipher`, in upper case, is not in `GOOD_CIPHERS` (the AEAD ciphers
     AES-128-GCM, AES-256-GCM and ChaCha20-Poly1305). ECB, CBC, CTR, DES, 3DES and RC4 are all weak.
   - `SHORT-KEY`: `rsa_bits` is under 2048.
   - `WEAK-HASH`: `signature_hash`, in lower case, is in `WEAK_HASHES` (`md5`, `sha1`).
   - `POOR-RANDOMNESS`: `token_source` is not in `GOOD_TOKEN_SOURCES` (`secrets`, `os.urandom`).
     The `random` module is predictable.
   - `DOWNGRADE-RISK`: `tls_versions` (a list) contains a version in `OLD_TLS`
     (`SSLv3`, `TLSv1`, `TLSv1.1`). An old version left enabled is what a downgrade attack needs.
   - `HARDCODED-KEY`: the configuration has a `key` field that is not empty. Keys belong in a key
     management system, referred to by `key_ref`.
2. **`reused_nonces(path)`** reads an encryption log, a CSV file with the header
   `key_id,nonce,record`, and returns the **sorted** list of `(key_id, nonce)` tuples that occur
   more than once: a nonce used twice under the same key. Remove the spaces around both fields
   and lower-case the nonce first. Each pair appears once in the result, however often it was
   reused. The same nonce under two different keys is not a reuse.

**Example.** `python solution.py` prints:

```text
video-gateway: OK
records-api: WEAK-CIPHER, WEAK-HASH
pharmacy-link: WEAK-CIPHER, SHORT-KEY, WEAK-HASH, DOWNGRADE-RISK
reset-tokens: POOR-RANDOMNESS, HARDCODED-KEY
nonce reused: k-2026-10 9f1c2a7b3e4d5c6b7a8f9e0d
nonce reused: k-2026-11 000000000000000000000000
nonce reused: k-2026-11 000000000000000000000001
```

so `weak_settings` returns `["WEAK-CIPHER", "WEAK-HASH"]` for `records-api`, and
`reused_nonces("data/encrypt.log")` returns those three pairs as tuples. Under `k-2026-11` the
nonce counter restarted from zero after a restart, which is exactly the mistake the lesson warns
about.

**Tip.** A dict that counts each `(key_id, nonce)` tuple works well: `counts[pair] = counts.get(pair, 0) + 1`.
