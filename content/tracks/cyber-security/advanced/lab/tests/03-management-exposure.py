# Management ports reachable from outside the management zone.
def rule(seq, src_zone, dst_zone, proto, port, action="allow"):
    return {"seq": str(seq), "name": f"rule-{seq}", "src_zone": src_zone, "src": "any",
            "dst_zone": dst_zone, "dst": "10.20.0.0/24" if dst_zone != "internet" else "any",
            "proto": proto, "port": port, "action": action}


def exposed(r):
    found = firewall_findings([r])
    assert isinstance(found, list), f"firewall_findings should return a list, not {type(found).__name__}"
    return [f for f in found if f.startswith("FW-MGMT-EXPOSED")]


got = exposed(rule(5, "staff", "servers", "tcp", "22"))
assert len(got) == 1 and got[0].startswith("FW-MGMT-EXPOSED 5 ports "), (
    f"an allow rule from the staff zone to servers on tcp 22 should be reported once; got {got}")
assert got == ["FW-MGMT-EXPOSED 5 ports 22"], f"the finding should list the exposed port as the instructions show; got {got}"
assert exposed(rule(5, "mgmt", "servers", "tcp", "22")) == [], "rules from the mgmt zone are allowed to reach management ports"
assert exposed(rule(5, "staff", "servers", "tcp", "22", "deny")) == [], "deny rules expose nothing"
assert exposed(rule(5, "staff", "internet", "tcp", "22")) == [], "rules whose destination zone is internet are not checked"
assert exposed(rule(5, "staff", "servers", "tcp", "443")) == [], "tcp 443 is not a management port"
assert exposed(rule(5, "staff", "servers", "tcp", "161")) == [], "SNMP (161) is a management port only over udp"

got = exposed(rule(7, "staff", "servers", "tcp", "20-25"))
assert got == ["FW-MGMT-EXPOSED 7 ports 22,23"], f"a port range exposes every management port inside it; got {got}"
got = exposed(rule(7, "guest", "dmz", "udp", "any"))
assert got == ["FW-MGMT-EXPOSED 7 ports 161"], f"udp with port any exposes only the udp management port; got {got}"
got = exposed(rule(7, "staff", "servers", "tcp", "any"))
assert got == ["FW-MGMT-EXPOSED 7 ports 22,23,3389,5900,5985,5986"], (
    f"tcp with port any exposes every tcp management port, listed in ascending order; got {got}")
got = exposed(rule(7, "staff", "servers", "any", "160-170"))
assert got == ["FW-MGMT-EXPOSED 7 ports 161"], f"protocol any covers udp management ports too; got {got}"
got = exposed(rule(7, "any", "servers", "tcp", "3389"))
assert got == ["FW-MGMT-EXPOSED 7 ports 3389"], f"a source zone of any is not the mgmt zone; got {got}"
got = exposed(rule(7, "internet", "any", "tcp", "5985-5986"))
assert got == ["FW-MGMT-EXPOSED 7 ports 5985,5986"], f"a destination zone of any is not the internet zone; got {got}"

both = firewall_findings([rule(10, "staff", "servers", "tcp", "any")])
assert both == ["FW-BROAD 10", "FW-MGMT-EXPOSED 10 ports 22,23,3389,5900,5985,5986"], (
    f"for one rule, FW-BROAD comes before FW-MGMT-EXPOSED; got {both}")
