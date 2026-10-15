# Shadowed and overly broad firewall rules: order, zones, addresses, protocols and port ranges.
def rule(seq, src_zone, src, dst_zone, dst, proto, port, action="allow"):
    return {"seq": str(seq), "name": f"rule-{seq}", "src_zone": src_zone, "src": src,
            "dst_zone": dst_zone, "dst": dst, "proto": proto, "port": port, "action": action}


def review(*rules):
    found = firewall_findings(list(rules))
    assert isinstance(found, list), f"firewall_findings should return a list, not {type(found).__name__}"
    return [f for f in found if f.startswith(("FW-SHADOWED", "FW-BROAD"))]


# Order: seq is a number, and the export is not sorted.
got = review(rule(100, "staff", "10.10.1.0/24", "internet", "198.51.100.7", "tcp", "443"),
             rule(20, "staff", "10.10.0.0/16", "internet", "198.51.100.0/24", "tcp", "443-445"))
assert got == ["FW-SHADOWED 100 by 20"], (
    "a rule listed in the export before a lower-numbered rule must still be evaluated after it, "
    f"in ascending numeric seq order; got {got}")
got = review(rule(9, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"),
             rule(10, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"))
assert got == ["FW-SHADOWED 10 by 9"], f"seq 9 comes before seq 10 (numeric order, not text order); got {got}"

# Protocols.
got = review(rule(10, "staff", "any", "internet", "any", "udp", "53"),
             rule(20, "staff", "any", "internet", "any", "tcp", "53"))
assert got == [], f"an earlier udp rule does not cover a later tcp rule; got {got}"
got = review(rule(10, "staff", "any", "internet", "any", "any", "53"),
             rule(20, "staff", "any", "internet", "any", "tcp", "53"))
assert got == ["FW-SHADOWED 20 by 10"], f"an earlier rule with protocol any covers a later tcp rule; got {got}"
got = review(rule(10, "staff", "any", "internet", "any", "tcp", "53"),
             rule(20, "staff", "any", "internet", "any", "any", "53"))
assert got == [], f"an earlier tcp rule does not cover a later rule with protocol any; got {got}"

# Zones.
got = review(rule(10, "guest", "any", "internet", "any", "tcp", "443"),
             rule(20, "staff", "any", "internet", "any", "tcp", "443"))
assert got == [], f"a rule for another source zone does not cover the later rule; got {got}"
got = review(rule(10, "any", "any", "any", "any", "tcp", "443", "deny"),
             rule(20, "staff", "any", "internet", "any", "tcp", "443"))
assert got == ["FW-SHADOWED 20 by 10"], f"an earlier rule whose zones are any covers every zone; got {got}"

# Addresses.
got = review(rule(10, "staff", "10.10.0.0/24", "internet", "any", "tcp", "443"),
             rule(20, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"))
assert got == [], f"a /24 does not cover a later /16; got {got}"
got = review(rule(10, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"),
             rule(20, "staff", "any", "internet", "any", "tcp", "443"))
assert got == [], f"a CIDR source does not cover a later rule whose source is any; got {got}"
got = review(rule(10, "staff", "10.10.0.0/16", "internet", "203.0.113.0/24", "tcp", "443"),
             rule(20, "staff", "10.10.7.9", "internet", "203.0.113.200", "tcp", "443"))
assert got == ["FW-SHADOWED 20 by 10"], f"single addresses inside earlier networks are covered; got {got}"
got = review(rule(10, "staff", "10.10.0.0/16", "internet", "203.0.113.0/25", "tcp", "443"),
             rule(20, "staff", "10.10.7.9", "internet", "203.0.113.200", "tcp", "443"))
assert got == [], f"a destination outside the earlier rule's network is not covered; got {got}"

# Ports.
got = review(rule(10, "staff", "any", "internet", "any", "tcp", "8000-8100"),
             rule(20, "staff", "any", "internet", "any", "tcp", "8080"))
assert got == ["FW-SHADOWED 20 by 10"], f"a port inside an earlier range is covered; got {got}"
got = review(rule(10, "staff", "any", "internet", "any", "tcp", "8000-8100"),
             rule(20, "staff", "any", "internet", "any", "tcp", "8050-8200"))
assert got == [], f"a range that only overlaps an earlier range is not covered; got {got}"
got = review(rule(10, "staff", "any", "internet", "any", "tcp", "1-65535"),
             rule(20, "staff", "any", "internet", "any", "tcp", "8443"))
assert got == ["FW-SHADOWED 20 by 10"], f"a port inside an earlier full range is covered; got {got}"

# One finding per shadowed rule, naming the first rule that covers it; deny rules count too.
got = review(rule(10, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443", "deny"),
             rule(20, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"),
             rule(30, "staff", "10.10.4.0/24", "internet", "any", "tcp", "443"))
assert got == ["FW-SHADOWED 20 by 10", "FW-SHADOWED 30 by 10"], (
    f"each shadowed rule is reported once, by the lowest-numbered rule that covers it; got {got}")

# Broad rules: allow rules whose port is any; deny rules are never broad.
got = review(rule(10, "guest", "10.50.0.0/16", "internet", "any", "any", "any"),
             rule(20, "staff", "10.10.0.0/16", "internet", "any", "tcp", "443"),
             rule(30, "any", "any", "any", "any", "any", "any", "deny"))
assert got == ["FW-BROAD 10"], f"only allow rules whose port is any are broad; got {got}"
got = review(rule(10, "staff", "any", "internet", "any", "tcp", "any"),
             rule(20, "staff", "10.10.0.0/16", "internet", "any", "tcp", "any"))
assert got == ["FW-BROAD 10", "FW-SHADOWED 20 by 10", "FW-BROAD 20"], (
    f"findings are listed rule by rule, with FW-SHADOWED before FW-BROAD for the same rule; got {got}")
