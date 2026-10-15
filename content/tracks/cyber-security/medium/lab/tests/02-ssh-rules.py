# The SSH rules on a log built for the test: thresholds, ignored lines, accepted users, order.
import tempfile
from pathlib import Path

folder = Path(tempfile.mkdtemp())
lines = []


def add(text):
    n = len(lines) + 1
    lines.append(f"2026-10-15T01:{n // 60:02d}:{n % 60:02d}.000000+00:00 jump02 sshd[{4000 + n}]: {text}")


for _ in range(10):                                   # exactly 10 on one account
    add("Failed password for root from 198.51.100.9 port 40001 ssh2")
for _ in range(10):                                   # a tie on failures, compared as text
    add("Failed password for admin from 198.51.100.10 port 40002 ssh2")
for _ in range(9):                                    # one short of brute force
    add("Failed password for root from 192.0.2.20 port 40003 ssh2")
for user in ["ana", "bo", "cy", "di", "ed"]:          # 5 accounts, 3 each: spraying at the limit
    for _ in range(3):
        add(f"Failed password for {user} from 203.0.113.30 port 40004 ssh2")
for user, times in [("ana", 1), ("bo", 1), ("cy", 1), ("di", 1), ("ed", 4)]:   # one account has 4
    for _ in range(times):
        add(f"Failed password for {user} from 203.0.113.40 port 40005 ssh2")
for user in ["ana", "bo", "cy", "di"]:                # only 4 accounts
    add(f"Failed password for {user} from 203.0.113.50 port 40006 ssh2")
for user in ["x1", "x2", "x3", "x4", "x5"]:           # invalid users, each with its 'Invalid user' line
    add(f"Invalid user {user} from 192.0.2.60 port 40007")
    add(f"Failed password for invalid user {user} from 192.0.2.60 port 40007 ssh2")
    add(f"Connection closed by invalid user {user} 192.0.2.60 port 40007 [preauth]")
for user in ["p1", "p2", "p3", "p4", "p5"]:           # publickey failures with text after ssh2
    add(f"Failed publickey for {user} from 192.0.2.70 port 40008 ssh2: ED25519 SHA256:AbCdEf0123456789")
add("Accepted password for di from 203.0.113.30 port 40009 ssh2")
add("Accepted password for bo from 203.0.113.30 port 40010 ssh2")
add("Accepted password for di from 203.0.113.30 port 40011 ssh2")
add("Accepted publickey for deploy from 10.0.0.5 port 40012 ssh2: ED25519 SHA256:AbCdEf0123456789")
add("pam_unix(sshd:session): session opened for user di(uid=1004) by (uid=0)")
add("error: maximum authentication attempts exceeded for root from 192.0.2.20 port 40003 ssh2 [preauth]")
(folder / "auth.log").write_text("\n".join(lines) + "\n")

got = ssh_attacks(folder / "auth.log")
assert isinstance(got, list), "ssh_attacks returns a list"
by_ip = {r["ip"]: r for r in got}
assert "192.0.2.20" not in by_ip, "nine failures on one account is not brute force (and the 'error:' line is not a failure)"
assert "203.0.113.40" not in by_ip, "an IP with more than 3 failures on one account is not password spraying"
assert "203.0.113.50" not in by_ip, "an IP that tried fewer than 5 accounts is not password spraying"
assert "10.0.0.5" not in by_ip, "an IP with acceptances but no failures is not reported"
assert by_ip.get("198.51.100.9", {}).get("kind") == "brute-force", "exactly 10 failures on one account is brute force"
assert by_ip.get("203.0.113.30", {}).get("kind") == "password-spraying", (
    "5 accounts with at most 3 failures each is password spraying"
)
assert by_ip.get("192.0.2.60") == {"ip": "192.0.2.60", "kind": "password-spraying", "failures": 5, "accounts": 5,
                                   "accepted": []}, (
    "'invalid user' failures count once each, under the name after 'invalid user', and 'Invalid user' lines are ignored"
)
assert by_ip.get("192.0.2.70", {}).get("failures") == 5, "any 'Failed <method>' line counts, even with text after ssh2"
assert by_ip["203.0.113.30"]["accepted"] == ["bo", "di"], "accepted lists each user once, sorted"
assert by_ip["203.0.113.30"]["failures"] == 15 and by_ip["203.0.113.30"]["accounts"] == 5, (
    "failures and accounts are counted per IP"
)
assert [r["ip"] for r in got] == ["203.0.113.30", "198.51.100.10", "198.51.100.9", "192.0.2.60", "192.0.2.70"], (
    f"results are ordered by failures, highest first, then by IP as text (got {[r['ip'] for r in got]})"
)
assert set(got[0]) == {"ip", "kind", "failures", "accounts", "accepted"}, "each result has exactly the five keys"

(folder / "empty.log").write_text("")
assert ssh_attacks(folder / "empty.log") == [], "an empty log gives an empty list"
