# name_matches and check_certificate: wildcards, case, expiry boundaries, not-yet-valid,
# key types and sizes, signature hashes and self-signed certificates.
from datetime import date

for pattern, host, want, what in [
    ("maps.kestrelrescue.test", "maps.kestrelrescue.test", True, "an exact name"),
    ("Maps.KestrelRescue.test", "maps.kestrelrescue.TEST", True, "names compared without regard to case"),
    ("maps.kestrelrescue.test", "maps.kestrelrescue.test.example.org", False, "a longer name that only starts with the pattern"),
    ("*.radio.kestrelrescue.test", "gw.radio.kestrelrescue.test", True, "a wildcard covering one label"),
    ("*.radio.kestrelrescue.test", "GW.Radio.KestrelRescue.test", True, "a wildcard compared without regard to case"),
    ("*.radio.kestrelrescue.test", "a.b.radio.kestrelrescue.test", False, "a wildcard does not cover two labels"),
    ("*.radio.kestrelrescue.test", "radio.kestrelrescue.test", False, "a wildcard does not cover the bare domain"),
    ("*.radio.kestrelrescue.test", ".radio.kestrelrescue.test", False, "a wildcard needs a non-empty label"),
    ("*.radio.kestrelrescue.test", "gwradio.kestrelrescue.test", False, "a wildcard's domain must match after a dot"),
]:
    got = name_matches(pattern, host)
    assert got is want or got == want, f"name_matches: {what}"

day = date(2026, 11, 2)


def check(file, host, on=day):
    return check_certificate("data/" + file, host, on)


assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 11, 1)) == [], (
    "a certificate with more than 30 days left, a 2048-bit RSA key and a SHA-256 signature has no findings"
)
assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 11, 2)) == ["EXPIRES-SOON"], (
    "a certificate that expires exactly 30 days after the check date expires soon"
)
assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 12, 2)) == ["EXPIRES-SOON"], (
    "a certificate on its last day is not yet expired"
)
assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 12, 3)) == ["EXPIRED"], (
    "a certificate is expired the day after its notAfter date, and is then not also reported as expiring soon"
)
assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 6, 14)) == ["NOT-YET-VALID"], (
    "a certificate checked the day before its notBefore date is not yet valid"
)
assert check("edge-rsa2048.pem", "rota.kestrelrescue.test", date(2026, 6, 15)) == [], (
    "a certificate is valid on its notBefore date"
)
assert check("edge-rsa2048.pem", "rota2.kestrelrescue.test") == ["EXPIRES-SOON"], (
    "every DNS name in the SAN is tried, without regard to case"
)
assert check("edge-rsa2048.pem", "billing.kestrelrescue.test") == ["EXPIRES-SOON", "HOSTNAME-MISMATCH"], (
    "a host not in the SAN is reported, and the codes are sorted"
)
assert check("edge-not-yet-valid.pem", "status.kestrelrescue.test") == ["NOT-YET-VALID"], (
    "a certificate whose validity starts after the check date is reported"
)
assert check("edge-ed25519.pem", "beacon.kestrelrescue.test") == ["SELF-SIGNED"], (
    "an Ed25519 certificate (no key size, no separate signature hash) is checked without crashing"
)
assert check("edge-p224.pem", "sensor.kestrelrescue.test") == ["WEAK-KEY"], (
    "an elliptic-curve key below 256 bits is weak"
)
assert check("edge-md5.pem", "legacy.kestrelrescue.test") == ["SELF-SIGNED", "WEAK-SIGNATURE"], (
    "an MD5 signature is weak, and a certificate issued by its own subject is self-signed"
)
assert check("vpn.pem", "vpn.kestrelrescue.test", date(2030, 1, 1)) == [
    "EXPIRED", "HOSTNAME-MISMATCH", "SELF-SIGNED", "WEAK-KEY", "WEAK-SIGNATURE"
], "every finding of a certificate is returned, sorted, and the common name is never used as a host name"
assert check("callout.pem", "callout.kestrelrescue.test") == [], "a healthy certificate has no findings"
