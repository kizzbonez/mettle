# The worked example from the instructions: the shipped release, certificates and accounts.
from datetime import date

audit_day = date(2026, 11, 2)

files = verify_manifest("data/CHECKSUMS")
expected_files = {
    "callout.conf": "OK",
    "deploy.sh": "MISMATCH",
    "rota.csv": "OK",
    "pager-gateway.yaml": "WEAK-DIGEST",
    "radio-codes.txt": "MISSING",
}
assert files == expected_files, (
    f"verify_manifest('data/CHECKSUMS') should return\n{expected_files}\nIt returned\n{files}"
)
assert list(files) == list(expected_files), "verify_manifest keeps the entries in manifest order"

expected_certs = [
    ("callout.pem", "callout.kestrelrescue.test", []),
    ("maps.pem", "maps.kestrelrescue.test", ["EXPIRED"]),
    ("radio.pem", "gw.radio.kestrelrescue.test", ["EXPIRES-SOON"]),
    ("vpn.pem", "vpn.kestrelrescue.test", ["HOSTNAME-MISMATCH", "SELF-SIGNED", "WEAK-KEY", "WEAK-SIGNATURE"]),
    ("wiki.pem", "docs.kestrelrescue.test", ["HOSTNAME-MISMATCH"]),
]
for file, host, codes in expected_certs:
    got = check_certificate("data/" + file, host, audit_day)
    assert got == codes, f"check_certificate('data/{file}', '{host}', {audit_day!r}) should return {codes}, not {got}"

expected_hashes = {
    "amorgan": "OK", "bfinch": "OK", "cwu": "OK", "dkerr": "FAST-HASH", "eokafor": "LOW-COST",
    "fpatel": "LOW-COST", "gnovak": "LOW-COST", "hreyes": "UNKNOWN", "isato": "FAST-HASH",
}
with open("data/accounts.txt", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            user, _, stored = line.partition(":")
            got = classify_hash(stored)
            assert got == expected_hashes[user], (
                f"classify_hash for {user}'s record {stored!r} should be {expected_hashes[user]}, not {got}"
            )

report = [
    "FILE deploy.sh MISMATCH",
    "FILE pager-gateway.yaml WEAK-DIGEST",
    "FILE radio-codes.txt MISSING",
    "CERT maps.kestrelrescue.test EXPIRED",
    "CERT gw.radio.kestrelrescue.test EXPIRES-SOON",
    "CERT vpn.kestrelrescue.test HOSTNAME-MISMATCH,SELF-SIGNED,WEAK-KEY,WEAK-SIGNATURE",
    "CERT docs.kestrelrescue.test HOSTNAME-MISMATCH",
    "HASH dkerr FAST-HASH",
    "HASH eokafor LOW-COST",
    "HASH fpatel LOW-COST",
    "HASH gnovak LOW-COST",
    "HASH hreyes UNKNOWN",
    "HASH isato FAST-HASH",
]
ran = run_script()
assert ran.out.splitlines() == report + ["TOTAL 13 findings"], (
    "python solution.py should print exactly these lines:\n" + "\n".join(report + ["TOTAL 13 findings"])
    + f"\nIt printed:\n{ran.out}{ran.err}"
)
assert ran.code == 1, f"python solution.py should exit with status 1 when there are findings, not {ran.code}"
