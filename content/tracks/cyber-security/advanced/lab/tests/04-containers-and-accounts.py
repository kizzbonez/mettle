# Privileged containers, ports published on every interface, stale and over-privileged accounts.
from datetime import date

project = {
    "name": "clinic",
    "services": {
        "zeta": {"image": "z:1", "privileged": True,
                 "ports": [{"mode": "ingress", "target": 53, "published": "5353", "protocol": "udp"},
                           {"mode": "ingress", "host_ip": "10.30.0.10", "target": 80, "published": "80", "protocol": "tcp"},
                           {"mode": "ingress", "host_ip": "", "target": 81, "published": "8181"}]},
        "alpha": {"image": "a:1", "privileged": False,
                  "ports": [{"mode": "ingress", "host_ip": "::1", "target": 9000, "published": "9000", "protocol": "tcp"},
                            {"mode": "ingress", "host_ip": "0.0.0.0", "target": 9001, "published": "9001", "protocol": "tcp"}]},
        "mid": {"image": "m:1"},
        "beta": {"image": "b:1",
                 "ports": [{"mode": "ingress", "host_ip": "::", "target": 22, "published": "2222", "protocol": "tcp"},
                           {"mode": "ingress", "host_ip": "127.0.0.1", "target": 8080, "published": "8080", "protocol": "tcp"}]},
    },
}
got = container_findings(project)
assert isinstance(got, list), f"container_findings should return a list, not {type(got).__name__}"
assert "CT-PRIVILEGED clinic/zeta" in got and not any("alpha" in f and "PRIVILEGED" in f for f in got), (
    f"only services with privileged set to true are privileged; got {got}")
assert not any("8080" in f or "9000" in f or " 80/" in f for f in got), (
    f"ports bound to 127.0.0.1, ::1 or a specific address are not on all interfaces; got {got}")
assert "CT-ALL-INTERFACES clinic/zeta 5353/udp" in got, f"a port with no host_ip is published on all interfaces, with its protocol; got {got}"
assert "CT-ALL-INTERFACES clinic/zeta 8181/tcp" in got, f"an empty host_ip means all interfaces, and a missing protocol means tcp; got {got}"
assert "CT-ALL-INTERFACES clinic/beta 2222/tcp" in got, f"host_ip :: is every IPv6 interface; got {got}"
expected_order = ["CT-ALL-INTERFACES clinic/alpha 9001/tcp", "CT-ALL-INTERFACES clinic/beta 2222/tcp",
                  "CT-PRIVILEGED clinic/zeta", "CT-ALL-INTERFACES clinic/zeta 5353/udp",
                  "CT-ALL-INTERFACES clinic/zeta 8181/tcp"]
assert got == expected_order, (
    f"services are reviewed in alphabetical order, CT-PRIVILEGED before the ports, ports in file order; got {got}")
assert container_findings({"name": "empty", "services": {"a": {"image": "x"}}}) == [], "a service without ports or privileges has no findings"


def account(sam, kind, last, groups, enabled="true"):
    return {"sam_account": sam, "display_name": sam, "type": kind, "enabled": enabled,
            "last_logon": last, "groups": groups}


day = date(2027, 1, 15)
got = account_findings([account("ninety", "user", "2026-10-17", "Staff")], day)
assert got == [], f"an account last used exactly 90 days before the review date is not stale; got {got}"
got = account_findings([account("ninety-one", "user", "2026-10-16", "Staff")], day)
assert got == ["ACCT-STALE ninety-one 91"], f"an account last used more than 90 days before the review date is stale; got {got}"
got = account_findings([account("new", "service", "", "Staff")], day)
assert got == ["ACCT-STALE new never"], f"an enabled account that never logged on is stale; got {got}"
got = account_findings([account("gone", "user", "2025-01-01", "Domain Admins", enabled="false")], day)
assert got == [], f"disabled accounts are not reviewed; got {got}"
got = account_findings([account("adm-x", "admin", "2027-01-10", "Staff;Enterprise Admins")], day)
assert got == [], f"admin accounts may be in privileged groups; got {got}"
got = account_findings([account("svc-db", "service", "2027-01-14", "SQL Readers; schema admins ")], day)
assert got == ["ACCT-PRIVILEGED-SERVICE svc-db"], (
    f"group names are compared ignoring case and the spaces around them; got {got}")
got = account_findings([account("reader", "user", "2027-01-14", "Domain Admins Readers;Staff")], day)
assert got == [], f"a group whose name only contains a privileged group's name is not privileged; got {got}"
got = account_findings([account("old.admin", "user", "2026-01-02", "Administrators")], day)
assert got == ["ACCT-STALE old.admin 378", "ACCT-PRIVILEGED-USER old.admin"], (
    f"an account can have both findings, ACCT-STALE first; got {got}")
got = account_findings([account("b", "user", "2027-01-01", "Staff;Domain Admins"),
                        account("a", "service", "", "Staff")], day)
assert got == ["ACCT-PRIVILEGED-USER b", "ACCT-STALE a never"], f"accounts are reported in file order; got {got}"
