# in_scope: network edges, partial overlaps, single excluded addresses and host names.
scope = {
    "in": ["203.0.113.0/27", "portal.ashgrove.example", "10.40.0.0/16", "VPN.Ashgrove.example"],
    "out": ["10.40.9.0/24", "payments.ashgrove.example", "10.40.4.7"],
}
cases = [
    ("203.0.113.0", True, "the first address of an in-scope network"),
    ("203.0.113.31", True, "the last address of an in-scope network"),
    ("203.0.113.32", False, "the address just after an in-scope network"),
    ("203.0.113.0/28", True, "a network inside an in-scope network"),
    ("203.0.113.0/26", False, "a network larger than the in-scope network"),
    ("10.40.9.15", False, "an address inside an out-of-scope network"),
    ("10.40.9.0/25", False, "a network inside an out-of-scope network"),
    ("10.40.8.0/23", False, "a network that partly overlaps an out-of-scope network"),
    ("10.40.8.0/24", True, "a network next to an out-of-scope network"),
    ("10.40.4.7", False, "a single out-of-scope address"),
    ("10.40.4.0/24", False, "a network that contains a single out-of-scope address"),
    ("10.40.4.8", True, "the address next to a single out-of-scope address"),
    ("198.51.100.25", False, "an address in no in-scope network"),
    ("portal.ashgrove.example", True, "an in-scope host name"),
    ("PORTAL.ASHGROVE.EXAMPLE", True, "an in-scope host name in upper case"),
    ("vpn.ashgrove.example", True, "a host name listed in mixed case"),
    ("payments.ashgrove.example", False, "an out-of-scope host name"),
    ("dev.portal.ashgrove.example", False, "a subdomain of an in-scope host name"),
    ("ashgrove.example", False, "the parent domain of an in-scope host name"),
]
for target, expected, what in cases:
    got = in_scope(target, scope)
    assert got == expected, f"in_scope for {what}"
