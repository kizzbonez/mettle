"""Audit the TLS versions and cipher suites of an nginx site against RFC 8996 and RFC 9325.

Reading the file, the report and main are written. Write protocol_findings and cipher_reason.
"""
import sys

DEPRECATED = ["SSLv2", "SSLv3", "TLSv1", "TLSv1.1"]
REQUIRED = ["TLSv1.2", "TLSv1.3"]


def read_directive(path, name):
    """Return the value of directive NAME in an nginx file, without ';' and quotes, or "" if absent.

    Lines starting with # are comments. If the directive appears twice, the last one counts.
    """
    value = ""
    with open(path, encoding="utf-8") as f:
        for line in f:
            words = line.strip().split(None, 1)       # the directive name, then the rest
            if len(words) == 2 and words[0] == name:
                value = words[1].split(";")[0].replace('"', "").strip()
    return value


def protocol_findings(protocols):
    """Return the PROTOCOL findings for a list of version names such as ["TLSv1", "TLSv1.2"]."""
    findings = []
    for version in protocols:
        if version in DEPRECATED:
            findings.append(f"PROTOCOL {version} deprecated")
    for version in REQUIRED:
        if version not in protocols:
            findings.append(f"PROTOCOL {version} missing")
    return findings


def cipher_reason(suite):
    """Return why the OpenSSL cipher suite SUITE is weak, or None if it is fine or an exclusion."""
    if suite.startswith("!"):
        return None
    if "NULL" in suite:
        return "null"
    if "RC4" in suite:
        return "rc4"
    if suite.startswith("EXP"):
        return "export"
    if "DES" in suite:
        return "des"
    if not (suite.startswith("ECDHE-") or suite.startswith("DHE-")):
        return "no-forward-secrecy"
    if "GCM" not in suite and "CHACHA20" not in suite:
        return "not-aead"
    return None


def audit(path):
    """Return every finding for the nginx file at PATH, protocols first, then cipher suites."""
    findings = protocol_findings(read_directive(path, "ssl_protocols").split())
    for suite in read_directive(path, "ssl_ciphers").split(":"):
        if suite:
            reason = cipher_reason(suite)
            if reason is not None:
                findings.append(f"CIPHER {suite} {reason}")
    return findings


def main():
    """Print the findings for the file named on the command line; return 1 if any, else 0."""
    findings = audit(sys.argv[1])
    for finding in findings:
        print(finding)
    if not findings:
        print("OK")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
