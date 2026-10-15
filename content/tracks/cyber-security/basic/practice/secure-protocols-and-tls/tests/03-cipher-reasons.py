# cipher_reason: the first reason that applies, None for good suites and for exclusions.
cases = {
    "ECDHE-RSA-NULL-SHA": "null",
    "EXP-RC4-MD5": "rc4",
    "EXP-DES-CBC-SHA": "export",
    "ECDHE-RSA-DES-CBC3-SHA": "des",
    "AES256-SHA": "no-forward-secrecy",
    "AES256-GCM-SHA384": "no-forward-secrecy",
    "DHE-RSA-AES256-SHA256": "not-aead",
    "ECDHE-ECDSA-AES256-SHA": "not-aead",
    "DHE-RSA-AES128-GCM-SHA256": None,
    "ECDHE-ECDSA-CHACHA20-POLY1305": None,
    "ECDHE-RSA-AES256-GCM-SHA384": None,
    "!aNULL": None,
    "!eNULL": None,
    "!RC4": None,
}
for suite, want in cases.items():
    got = cipher_reason(suite)
    assert got == want, f"cipher_reason({suite!r}) should give the first reason that applies, or None"
