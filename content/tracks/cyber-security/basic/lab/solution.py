"""Crypto health check for the Kestrel Valley Mountain Rescue call-out service."""
import csv
import hashlib
import re
import sys
from datetime import date
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import ec, rsa

AUDIT_DATE = date(2026, 11, 2)
MANIFEST = "data/CHECKSUMS"
INVENTORY = "data/inventory.csv"
ACCOUNTS = "data/accounts.txt"

HEX = re.compile(r"[0-9a-fA-F]+")


def verify_manifest(manifest_path):
    """Return {file name: status} for every entry of the manifest, in manifest order."""
    folder = Path(manifest_path).parent
    results = {}
    with open(manifest_path, encoding="utf-8") as manifest:
        for line in manifest:
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            digest, rest = line.split(" ", 1)
            name = rest[1:]                       # skip the mode character (space or *)
            path = folder / name
            if len(digest) in (32, 40):
                results[name] = "WEAK-DIGEST"
            elif not path.is_file():
                results[name] = "MISSING"
            elif hashlib.sha256(path.read_bytes()).hexdigest() == digest.lower():
                results[name] = "OK"
            else:
                results[name] = "MISMATCH"
    return results


def name_matches(pattern, hostname):
    """True if a certificate DNS name (possibly a wildcard) covers hostname."""
    pattern, hostname = pattern.lower(), hostname.lower()
    if pattern.startswith("*."):
        label, dot, rest = hostname.partition(".")
        return bool(label) and dot == "." and rest == pattern[2:]
    return pattern == hostname


def check_certificate(pem_path, hostname, on_date):
    """Return the sorted problem codes for one certificate checked on on_date."""
    with open(pem_path, "rb") as f:
        cert = x509.load_pem_x509_certificate(f.read())
    codes = []

    days_left = (cert.not_valid_after_utc.date() - on_date).days
    if days_left < 0:
        codes.append("EXPIRED")
    elif days_left <= 30:
        codes.append("EXPIRES-SOON")
    if cert.not_valid_before_utc.date() > on_date:
        codes.append("NOT-YET-VALID")

    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        names = san.value.get_values_for_type(x509.DNSName)
    except x509.ExtensionNotFound:
        names = []
    if not any(name_matches(name, hostname) for name in names):
        codes.append("HOSTNAME-MISMATCH")

    if cert.issuer == cert.subject:
        codes.append("SELF-SIGNED")

    key = cert.public_key()
    if isinstance(key, rsa.RSAPublicKey) and key.key_size < 2048:
        codes.append("WEAK-KEY")
    if isinstance(key, ec.EllipticCurvePublicKey) and key.key_size < 256:
        codes.append("WEAK-KEY")

    algorithm = cert.signature_hash_algorithm
    if algorithm is not None and algorithm.name in ("md5", "sha1"):
        codes.append("WEAK-SIGNATURE")
    return sorted(codes)


def classify_hash(stored):
    """Return OK, LOW-COST, FAST-HASH or UNKNOWN for one stored password record."""
    parts = stored.split("$")
    try:
        if stored.startswith("$argon2id$"):
            params = dict(pair.split("=") for pair in parts[3].split(","))
            strong = int(params["m"]) >= 19456 and int(params["t"]) >= 2
            return "OK" if strong else "LOW-COST"
        if stored.startswith(("$2a$", "$2b$", "$2y$")):
            return "OK" if int(parts[2]) >= 10 else "LOW-COST"
        if stored.startswith("$pbkdf2-sha256$"):
            return "OK" if int(parts[2]) >= 600000 else "LOW-COST"
    except (IndexError, KeyError, ValueError):
        return "UNKNOWN"
    if len(stored) in (32, 40, 64) and HEX.fullmatch(stored):
        return "FAST-HASH"
    return "UNKNOWN"


def audit(manifest_path, inventory_path, accounts_path, on_date):
    """Return the report lines for every finding, files first, then certificates, then hashes."""
    lines = []
    for name, status in verify_manifest(manifest_path).items():
        if status != "OK":
            lines.append(f"FILE {name} {status}")

    folder = Path(inventory_path).parent
    with open(inventory_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            codes = check_certificate(folder / row["file"], row["hostname"], on_date)
            if codes:
                lines.append(f"CERT {row['hostname']} {','.join(codes)}")

    with open(accounts_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            user, _, stored = line.partition(":")
            status = classify_hash(stored)
            if status != "OK":
                lines.append(f"HASH {user} {status}")
    return lines


def main():
    lines = audit(MANIFEST, INVENTORY, ACCOUNTS, AUDIT_DATE)
    for line in lines:
        print(line)
    print(f"TOTAL {len(lines)} findings")
    return 1 if lines else 0


if __name__ == "__main__":
    sys.exit(main())
