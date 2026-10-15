Write `solution.py`. The starter declares the functions the tests call; keep their names and
parameters, and keep the constants `AUDIT_DATE`, `MANIFEST`, `INVENTORY` and `ACCOUNTS`. You may
add functions. Use the standard library and the `cryptography` package (lessons 5, 9 and 12 show
every call you need). Dates are `datetime.date` values; never read the clock.

1. **`verify_manifest(manifest_path)`** reads a checksum manifest and returns a `dict` from file
   name to status, in the order of the manifest.
   - Skip blank lines (including lines of only spaces) and lines starting with `#`.
   - Every other line is: a hexadecimal digest, one space, a mode character (a space for text
     mode or `*` for binary mode), then the file name, which runs to the end of the line and may
     contain spaces. File names are relative to the folder that holds the manifest.
   - Status, decided in this order:
     - `WEAK-DIGEST` if the digest has 32 or 40 characters (MD5 or SHA-1). Do not even look at the
       file: a weak digest proves nothing.
     - `MISSING` if the file does not exist.
     - `OK` if the SHA-256 digest of the file's bytes equals the listed digest, compared without
       regard to case.
     - `MISMATCH` otherwise.
2. **`name_matches(pattern, hostname)`** returns `True` if one DNS name from a certificate covers
   `hostname`, compared without regard to case. A pattern starting with `*.` is a wildcard: it
   covers a host name made of exactly one non-empty label, a dot, and the rest of the pattern
   (`*.radio.kestrelrescue.test` covers `gw.radio.kestrelrescue.test` but neither
   `radio.kestrelrescue.test` nor `a.b.radio.kestrelrescue.test`). Any other pattern must equal
   the host name.
3. **`check_certificate(pem_path, hostname, on_date)`** loads one PEM certificate and returns the
   list of problem codes that apply, **sorted** alphabetically, or `[]` when there are none. Use
   the UTC dates of `not_valid_before_utc` and `not_valid_after_utc` (call `.date()`).
   - `EXPIRED`: the notAfter date is before `on_date`.
   - `EXPIRES-SOON`: not expired, and the notAfter date is at most 30 days after `on_date` (a
     certificate on its last day counts).
   - `NOT-YET-VALID`: the notBefore date is after `on_date`.
   - `HOSTNAME-MISMATCH`: no DNS name in the Subject Alternative Name extension matches
     `hostname` (use `name_matches`). A certificate without that extension always mismatches; the
     common name is never used.
   - `SELF-SIGNED`: the issuer name equals the subject name.
   - `WEAK-KEY`: an RSA key under 2048 bits or an elliptic-curve key under 256 bits. Other key
     types, such as Ed25519, which has no `key_size`, are never weak.
   - `WEAK-SIGNATURE`: the signature hash is MD5 or SHA-1 (`signature_hash_algorithm.name` is
     `md5` or `sha1`). Ed25519 certificates have no separate hash: `signature_hash_algorithm` is
     `None`, which is not weak.
4. **`classify_hash(stored)`** returns one status for a stored password record:
   - `$argon2id$v=19$m=M,t=T,p=P$salt$hash`: `OK` if `M` is at least 19456 (KiB) **and** `T` is at
     least 2, otherwise `LOW-COST`.
   - `$2a$`, `$2b$` or `$2y$` followed by a two-digit cost (bcrypt, such as `$2b$12$...`): `OK` if
     the cost is at least 10, otherwise `LOW-COST`.
   - `$pbkdf2-sha256$ITERATIONS$salt$hash`: `OK` if the iterations are at least 600000,
     otherwise `LOW-COST`.
   - A bare digest of exactly 32, 40 or 64 hexadecimal characters, in either case (an unsalted
     MD5, SHA-1 or SHA-256): `FAST-HASH`.
   - Anything else, including other schemes such as `$argon2i$` or `$pbkdf2-sha512$`, a
     plaintext password and an empty string: `UNKNOWN`, for a person to review.
5. **`audit(manifest_path, inventory_path, accounts_path, on_date)`** returns the report lines, in
   this order, with no line for anything healthy:
   - `FILE NAME STATUS` for each manifest entry whose status is not `OK`, in manifest order.
   - `CERT HOSTNAME CODES` for each row of the inventory (a CSV file with the header
     `file,hostname`; certificate files are relative to the inventory's folder) whose certificate
     has problems on `on_date`, in inventory order. `CODES` is the sorted list joined with commas
     and no spaces.
   - `HASH USER STATUS` for each account whose status is not `OK`, in file order. Each line of
     the accounts file is `user:record`, split at the first colon; remove the spaces and line
     ending around the line first, and skip blank lines and lines starting with `#`.
6. **`main()`** runs `audit(MANIFEST, INVENTORY, ACCOUNTS, AUDIT_DATE)`, reading the constants
   when it runs, prints each line, then a last line `TOTAL N findings`, and returns 1 if there
   was at least one finding, otherwise 0. The file ends with `sys.exit(main())` under
   `if __name__ == "__main__":`, so `python solution.py` exits with that status. Print nothing
   else and write nothing to standard error.

**Example.** On the shipped data, `python solution.py` prints this and exits with status 1:

```text
FILE deploy.sh MISMATCH
FILE pager-gateway.yaml WEAK-DIGEST
FILE radio-codes.txt MISSING
CERT maps.kestrelrescue.test EXPIRED
CERT gw.radio.kestrelrescue.test EXPIRES-SOON
CERT vpn.kestrelrescue.test HOSTNAME-MISMATCH,SELF-SIGNED,WEAK-KEY,WEAK-SIGNATURE
CERT docs.kestrelrescue.test HOSTNAME-MISMATCH
HASH dkerr FAST-HASH
HASH eokafor LOW-COST
HASH fpatel LOW-COST
HASH gnovak LOW-COST
HASH hreyes UNKNOWN
HASH isato FAST-HASH
TOTAL 13 findings
```

Why: `deploy.sh` gained a line after the manifest was built; `pager-gateway.yaml` is listed with
an MD5 digest; `radio-codes.txt` was never shipped. The maps certificate ended on 16 September
2026; the radio wildcard ends on 20 November, 18 days after the audit; the VPN appliance's own
certificate has no SAN, a 1024-bit RSA key and a SHA-1 signature; the wiki certificate names
`wiki` and `kb` but not `docs`. Dana Kerr's record is a bare MD5 digest, Ebo Okafor's bcrypt cost
is 8, Farah Patel's Argon2id uses 4096 KiB, Goran Novak's PBKDF2 uses 29000 iterations, Hugo
Reyes's "record" looks like a plaintext password, and Ines Sato's is a bare SHA-1 digest.

**Tips.** Build and try one function at a time on the shipped files, in the order above. For a
certificate, `cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)` raises
`x509.ExtensionNotFound` when there is no SAN, and `.value.get_values_for_type(x509.DNSName)`
lists its DNS names. `isinstance(key, rsa.RSAPublicKey)` and
`isinstance(key, ec.EllipticCurvePublicKey)` tell key types apart.
