"""Architecture and controls review for the Brightwater Veterinary Group."""
import csv
import ipaddress
import json
import re
import sys
from datetime import date
from pathlib import Path

REVIEW_DATE = date(2026, 10, 1)
STALE_DAYS = 90
MGMT_PORTS = [("tcp", 22), ("tcp", 23), ("udp", 161), ("tcp", 3389),
              ("tcp", 5900), ("tcp", 5985), ("tcp", 5986)]
PRIVILEGED_GROUPS = {"domain admins", "enterprise admins", "schema admins", "administrators"}


# ---------- reading the files (given) ----------

def read_csv(path):
    with open(path, newline="") as handle:
        return list(csv.DictReader(handle))


def read_json(path):
    with open(path) as handle:
        return json.load(handle)


def read_lines(path):
    with open(path) as handle:
        return handle.read().splitlines()


# ---------- write these five functions ----------

def firewall_findings(rules):
    """Return the FW-SHADOWED, FW-BROAD and FW-MGMT-EXPOSED findings for a list of rule dicts."""
    # TODO: evaluate the rules in ascending numeric seq order (instructions, step 1).
    raise NotImplementedError


def container_findings(project):
    """Return the CT-PRIVILEGED and CT-ALL-INTERFACES findings for one Compose project dict."""
    # TODO: instructions, step 2.
    raise NotImplementedError


def account_findings(accounts, review_date):
    """Return the ACCT-STALE, ACCT-PRIVILEGED-USER and ACCT-PRIVILEGED-SERVICE findings."""
    # TODO: instructions, step 3.
    raise NotImplementedError


def parse_txt(lines):
    """Return {owner: [record text, ...]} for the TXT lines of a zone export."""
    # TODO: instructions, step 4.
    raise NotImplementedError


def email_findings(txt, domains):
    """Return the MAIL-SPF-* and MAIL-DMARC-* findings for each domain, in the given order."""
    # TODO: instructions, step 5.
    raise NotImplementedError


# ---------- the report (given) ----------

def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    data = Path(args[0] if args else "data")
    findings = firewall_findings(read_csv(data / "firewall-rules.csv"))
    for path in sorted(data.glob("compose-*.json")):
        findings += container_findings(read_json(path))
    findings += account_findings(read_csv(data / "accounts.csv"), REVIEW_DATE)
    domains = [line.strip() for line in read_lines(data / "mail-domains.txt")
               if line.strip() and not line.startswith("#")]
    findings += email_findings(parse_txt(read_lines(data / "dns-txt.txt")), domains)
    for finding in findings:
        print(finding)
    print(f"TOTAL {len(findings)}")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
