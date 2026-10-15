# protocol_findings: exact names, the order listed, then the two required versions.
assert protocol_findings(["SSLv3", "TLSv1.2", "SSLv2"]) == [
    "PROTOCOL SSLv3 deprecated", "PROTOCOL SSLv2 deprecated", "PROTOCOL TLSv1.3 missing",
], "deprecated versions in the order listed, then a missing TLSv1.3"
assert protocol_findings(["TLSv1.3"]) == ["PROTOCOL TLSv1.2 missing"], "TLS 1.3 alone still lacks the TLS 1.2 that RFC 9325 requires"
assert protocol_findings(["TLSv1.2", "TLSv1.3"]) == [], "TLSv1.2 and TLSv1.3 together have no findings (TLSv1.2 is not TLSv1)"
assert protocol_findings(["TLSv1.3", "TLSv1.2"]) == [], "the order of the required versions does not matter"
assert protocol_findings(["TLSv1.1", "TLSv1.3", "TLSv1"]) == [
    "PROTOCOL TLSv1.1 deprecated", "PROTOCOL TLSv1 deprecated", "PROTOCOL TLSv1.2 missing",
], "TLSv1.1 and TLSv1 are deprecated, reported in the order listed"
assert protocol_findings([]) == ["PROTOCOL TLSv1.2 missing", "PROTOCOL TLSv1.3 missing"], "an empty list lacks both required versions"
