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
ALL_INTERFACES = {"", "0.0.0.0", "::"}


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


# ---------- firewall rules ----------

def port_range(text):
    """'any' -> (0, 65535); '443' -> (443, 443); '8000-8100' -> (8000, 8100)."""
    if text == "any":
        return (0, 65535)
    low, _, high = text.partition("-")
    return (int(low), int(high or low))


def covers_address(outer, inner):
    if outer == "any":
        return True
    if inner == "any":
        return False
    return ipaddress.ip_network(inner, strict=False).subnet_of(ipaddress.ip_network(outer, strict=False))


def covers_value(outer, inner):
    return outer == "any" or outer == inner


def covers(earlier, rule):
    """True when every packet that matches RULE also matches EARLIER."""
    low, high = port_range(earlier["port"])
    rule_low, rule_high = port_range(rule["port"])
    return (covers_value(earlier["src_zone"], rule["src_zone"])
            and covers_value(earlier["dst_zone"], rule["dst_zone"])
            and covers_address(earlier["src"], rule["src"])
            and covers_address(earlier["dst"], rule["dst"])
            and covers_value(earlier["proto"], rule["proto"])
            and low <= rule_low and rule_high <= high)


def exposed_mgmt_ports(rule):
    if rule["action"] != "allow" or rule["src_zone"] == "mgmt" or rule["dst_zone"] == "internet":
        return []
    low, high = port_range(rule["port"])
    ports = {port for proto, port in MGMT_PORTS
             if rule["proto"] in ("any", proto) and low <= port <= high}
    return sorted(ports)


def firewall_findings(rules):
    ordered = sorted(rules, key=lambda rule: int(rule["seq"]))
    findings = []
    for index, rule in enumerate(ordered):
        for earlier in ordered[:index]:
            if covers(earlier, rule):
                findings.append(f"FW-SHADOWED {rule['seq']} by {earlier['seq']}")
                break
        if rule["action"] == "allow" and rule["port"] == "any":
            findings.append(f"FW-BROAD {rule['seq']}")
        ports = exposed_mgmt_ports(rule)
        if ports:
            findings.append(f"FW-MGMT-EXPOSED {rule['seq']} ports {','.join(map(str, ports))}")
    return findings


# ---------- containers ----------

def container_findings(project):
    findings = []
    name = project["name"]
    for service_name in sorted(project["services"]):
        service = project["services"][service_name]
        if service.get("privileged") is True:
            findings.append(f"CT-PRIVILEGED {name}/{service_name}")
        for port in service.get("ports", []):
            if port.get("host_ip", "") in ALL_INTERFACES:
                protocol = port.get("protocol", "tcp")
                findings.append(f"CT-ALL-INTERFACES {name}/{service_name} {port['published']}/{protocol}")
    return findings


# ---------- accounts ----------

def account_findings(accounts, review_date):
    findings = []
    for account in accounts:
        if account["enabled"] != "true":
            continue
        sam = account["sam_account"]
        if not account["last_logon"]:
            findings.append(f"ACCT-STALE {sam} never")
        else:
            days = (review_date - date.fromisoformat(account["last_logon"])).days
            if days > STALE_DAYS:
                findings.append(f"ACCT-STALE {sam} {days}")
        groups = {group.strip().lower() for group in account["groups"].split(";")}
        if groups & PRIVILEGED_GROUPS:
            if account["type"] == "user":
                findings.append(f"ACCT-PRIVILEGED-USER {sam}")
            elif account["type"] == "service":
                findings.append(f"ACCT-PRIVILEGED-SERVICE {sam}")
    return findings


# ---------- email DNS records ----------

def parse_txt(lines):
    records = {}
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith(";"):
            continue
        owner = stripped.split()[0].rstrip(".").lower()
        text = "".join(re.findall(r'"([^"]*)"', stripped))
        records.setdefault(owner, []).append(text)
    return records


def spf_finding(domain, records):
    spf = [text for text in records if re.match(r"v=spf1(\s|$)", text, re.IGNORECASE)]
    if not spf:
        return f"MAIL-SPF-MISSING {domain}"
    if len(spf) > 1:
        return f"MAIL-SPF-MULTIPLE {domain}"
    terms = spf[0].lower().split()
    all_terms = [term for term in terms if re.fullmatch(r"[+\-~?]?all", term)]
    if all_terms:
        if all_terms[-1][0] not in "-~":
            return f"MAIL-SPF-WEAK {domain} {all_terms[-1]}"
        return None
    if any(term.startswith("redirect=") for term in terms):
        return None
    return f"MAIL-SPF-WEAK {domain} no-all"


def dmarc_finding(domain, records):
    dmarc = [text for text in records if text.lstrip().lower().startswith("v=dmarc1")]
    if not dmarc:
        return f"MAIL-DMARC-MISSING {domain}"
    tags = {}
    for part in dmarc[0].split(";"):
        name, _, value = part.partition("=")
        tags[name.strip().lower()] = value.strip().lower()
    if tags.get("p", "none") == "none":
        return f"MAIL-DMARC-NONE {domain}"
    return None


def email_findings(txt, domains):
    findings = []
    for domain in domains:
        domain = domain.lower()
        for finding in (spf_finding(domain, txt.get(domain, [])),
                        dmarc_finding(domain, txt.get(f"_dmarc.{domain}", []))):
            if finding:
                findings.append(finding)
    return findings


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
