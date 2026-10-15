# classify_hash: each scheme's cost floor, exact boundaries, bare digests and unknown records.
salt = "$c2FsdHNhbHRzYWx0c2FsdA$aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g"
bcrypt_body = "N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

for record, want, what in [
    ("$argon2id$v=19$m=19456,t=2,p=1" + salt, "OK", "Argon2id at exactly 19456 KiB and 2 passes"),
    ("$argon2id$v=19$m=65536,t=3,p=4" + salt, "OK", "Argon2id above both floors"),
    ("$argon2id$v=19$m=19455,t=2,p=1" + salt, "LOW-COST", "Argon2id with memory just below 19456 KiB"),
    ("$argon2id$v=19$m=47104,t=1,p=1" + salt, "LOW-COST", "Argon2id with a single pass"),
    ("$argon2i$v=19$m=65536,t=3,p=4" + salt, "UNKNOWN", "a record of Argon2i, which is not one of the recognized schemes"),
    ("$2b$10$" + bcrypt_body, "OK", "bcrypt at exactly cost 10"),
    ("$2y$09$" + bcrypt_body, "LOW-COST", "bcrypt ($2y$) at cost 9"),
    ("$2a$14$" + bcrypt_body, "OK", "bcrypt ($2a$) at cost 14"),
    ("$pbkdf2-sha256$600000$c2FsdHNhbHQ$aGFzaGhhc2g", "OK", "PBKDF2-SHA256 at exactly 600000 iterations"),
    ("$pbkdf2-sha256$599999$c2FsdHNhbHQ$aGFzaGhhc2g", "LOW-COST", "PBKDF2-SHA256 just below 600000 iterations"),
    ("$pbkdf2-sha512$900000$c2FsdHNhbHQ$aGFzaGhhc2g", "UNKNOWN", "PBKDF2 with a hash other than SHA-256"),
    ("5F4DCC3B5AA765D61D8327DEB882CF99", "FAST-HASH", "a bare 32-character digest in upper case"),
    ("54939c13a5b581d08600031e3403302b7ef7efd9", "FAST-HASH", "a bare 40-character digest"),
    ("5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", "FAST-HASH", "a bare 64-character digest"),
    ("5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d", "UNKNOWN", "63 hexadecimal characters"),
    ("z" * 32, "UNKNOWN", "32 characters that are not hexadecimal"),
    ("BlueRidge-Lantern-2026", "UNKNOWN", "a record that looks like a plaintext password"),
    ("", "UNKNOWN", "an empty record"),
]:
    got = classify_hash(record)
    assert got == want, f"classify_hash: {what}"
