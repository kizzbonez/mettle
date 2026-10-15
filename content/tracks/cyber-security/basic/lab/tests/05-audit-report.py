# audit() on another date and on clean inputs, and main()'s output and exit status.
import contextlib
import hashlib
import io
import os
import shutil
import tempfile
from datetime import date

import solution

lines = audit("data/CHECKSUMS", "data/inventory.csv", "data/accounts.txt", date(2026, 9, 1))
assert isinstance(lines, list), "audit returns a list of report lines"
certs = [line for line in lines if line.startswith("CERT ")]
assert certs == [
    "CERT maps.kestrelrescue.test EXPIRES-SOON",
    "CERT vpn.kestrelrescue.test HOSTNAME-MISMATCH,SELF-SIGNED,WEAK-KEY,WEAK-SIGNATURE",
    "CERT docs.kestrelrescue.test HOSTNAME-MISMATCH",
], "audit checks every certificate on the date it is given, in inventory order"
assert [line.split()[0] for line in lines] == ["FILE"] * 3 + ["CERT"] * 3 + ["HASH"] * 6, (
    "audit lists file findings first, then certificate findings, then hash findings"
)
assert len(lines) == 12, "audit reports only findings, one line each"

with tempfile.TemporaryDirectory() as folder:
    os.mkdir(os.path.join(folder, "rel"))
    os.mkdir(os.path.join(folder, "pki"))
    data = b"quorum_minutes = 10\n"
    with open(os.path.join(folder, "rel", "callout.conf"), "wb") as f:
        f.write(data)
    with open(os.path.join(folder, "rel", "SUMS"), "w", encoding="utf-8") as f:
        f.write(f"# clean\n{hashlib.sha256(data).hexdigest()}  callout.conf\n")
    shutil.copy("data/callout.pem", os.path.join(folder, "pki", "front-door.pem"))
    with open(os.path.join(folder, "pki", "hosts.csv"), "w", encoding="utf-8") as f:
        f.write("file,hostname\nfront-door.pem,callout.kestrelrescue.test\n")
    with open(os.path.join(folder, "users.txt"), "w", encoding="utf-8") as f:
        f.write("# clean\n\namorgan:$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy\n")
    manifest = os.path.join(folder, "rel", "SUMS")
    inventory = os.path.join(folder, "pki", "hosts.csv")
    accounts = os.path.join(folder, "users.txt")

    clean = audit(manifest, inventory, accounts, date(2026, 11, 2))
    assert clean == [], "audit returns no lines when every file, certificate and hash is healthy (certificate paths are relative to the inventory's folder)"

    solution.MANIFEST, solution.INVENTORY, solution.ACCOUNTS = manifest, inventory, accounts
    printed = io.StringIO()
    with contextlib.redirect_stdout(printed):
        status = solution.main()
    assert printed.getvalue().splitlines() == ["TOTAL 0 findings"], (
        "main prints only the TOTAL line when there are no findings (it reads MANIFEST, INVENTORY and ACCOUNTS when it runs)"
    )
    assert status == 0, "main returns 0 when there are no findings"

ran = run_script()
assert ran.code == 1, "python solution.py exits with status 1 when there are findings"
assert ran.out.splitlines()[-1:] == ["TOTAL 13 findings"], "the last line is the TOTAL line with the number of findings"
assert ran.err == "", "python solution.py writes nothing to standard error"
