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
    # YOUR CODE: "PROTOCOL NAME deprecated" for each deprecated version, in the order listed,
    # then "PROTOCOL NAME missing" for each version in REQUIRED that is not listed.
    raise NotImplementedError


def cipher_reason(suite):
    """Return why the OpenSSL cipher suite SUITE is weak, or None if it is fine or an exclusion."""
    # YOUR CODE: None for "!..." exclusions; otherwise the first reason that applies, in the
    # order of the instructions; None if no reason applies.
    raise NotImplementedError


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
