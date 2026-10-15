---
title: Certificates
summary: Read, check and manage X.509 certificates (SY0-801 objective 1.3). Build a small private PKI with OpenSSL, generate a CSR, verify a chain to its root of trust, compare self-signed, third-party, SAN and wildcard certificates, revoke with a CRL, understand OCSP and stapling, and track expiry under today's shorter certificate lifetimes.
minutes: 40
objectives:
  - Generate a certificate signing request and explain what it contains
  - Verify a certificate chain to a root of trust and diagnose common verification errors
  - Explain self-signed, third-party, SAN and wildcard certificates and check a hostname against them
  - Describe revocation with CRLs, OCSP and stapling, and check expiry, key size and signature algorithm
---

## Outline

1. What a certificate contains
2. Certificate signing requests
3. Chains and the root of trust
4. Names: SAN and wildcard certificates
5. Expiry
6. Revocation: CRL, OCSP and stapling
7. Reading certificates in Python

This lesson covers the certificates bullets of SY0-801 objective 1.3: certificate authorities,
CRLs, OCSP, self-signed, third-party, root of trust, CSR generation and wildcard.

## What a certificate contains

Lesson 8 introduced a **certificate**: a document, signed by a **certificate authority** (CA),
that binds a public key to a name. The format is **X.509** (RFC 5280). Its main fields are the
serial number, the **issuer** (the CA that signed it), the **validity** period (`notBefore` and
`notAfter`), the **subject**, the subject's public key, the CA's signature algorithm and
signature, and **extensions** such as the names it is valid for, whether it may act as a CA
(`basicConstraints`), and what the key may be used for.

The examples use a private PKI for a clinic group: a root CA, an issuing (intermediate) CA, and a
certificate for its patient portal, all under the reserved `.test` domain.

## Certificate signing requests

The applicant creates the key pair and a **certificate signing request** (CSR): the public key,
the requested names, signed with the private key to prove possession. The private key never
leaves the server:

```console
$ openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout portal.key -out portal.csr -subj "/O=Example Clinics/CN=portal.example.test" -addext "subjectAltName=DNS:portal.example.test,DNS:records.example.test" 2>/dev/null
$ openssl req -in portal.csr -noout -verify -subject
Certificate request self-signature verify OK
subject=O = Example Clinics, CN = portal.example.test
$ openssl req -in portal.csr -noout -text | grep -A1 "Subject Alternative Name"
                X509v3 Subject Alternative Name: 
                    DNS:portal.example.test, DNS:records.example.test
```

A public CA checks that the applicant controls the domain (with a DNS record or an HTTP file)
before signing; ACME (Automated Certificate Management Environment, RFC 8555) automates this.

## Chains and the root of trust

The issuing CA signed the portal certificate; the root CA signed the issuing CA. Software trusts a
certificate when it can build a **chain** from it up to a **root certificate** in its trust store.
That root is the **root of trust**: it is self-signed, and nothing vouches for it except its
presence in the operating system or browser store. Roots are kept offline, and day-to-day signing
is done by intermediates so that a compromised intermediate can be revoked without replacing the
root everywhere.

```console
$ openssl x509 -in portal.pem -noout -subject -issuer -dates -ext subjectAltName
subject=O = Example Clinics, CN = portal.example.test
issuer=O = Example Clinics, CN = Example Clinics Issuing CA 1
notBefore=Oct 15 16:53:34 2026 GMT
notAfter=Apr 13 16:53:34 2027 GMT
X509v3 Subject Alternative Name: 
    DNS:portal.example.test, DNS:records.example.test
$ openssl verify -CAfile root.pem -untrusted int.pem portal.pem
portal.pem: OK
$ openssl verify -CAfile root.pem portal.pem
O = Example Clinics, CN = portal.example.test
error 20 at 0 depth lookup: unable to get local issuer certificate
error portal.pem: verification failed
$ openssl x509 -in root.pem -noout -subject -issuer
subject=O = Example Clinics, CN = Example Clinics Root CA
issuer=O = Example Clinics, CN = Example Clinics Root CA
$ openssl verify root.pem
O = Example Clinics, CN = Example Clinics Root CA
error 18 at 0 depth lookup: self-signed certificate
error root.pem: verification failed
```

Error 20 is the classic "missing intermediate": a server must send its intermediate certificates
along with its own, or clients cannot build the chain. Error 18 shows a **self-signed**
certificate, one whose issuer is its own subject. Every root is self-signed, but a self-signed
*server* certificate is trusted only by machines where someone installed it by hand: fine in a lab,
a problem in production. **Third-party** certificates come from a public CA whose root browsers
already trust, so anyone can verify them. Organizations running a **private CA**, as here,
distribute their root to company devices through device management.

## Names: SAN and wildcard certificates

Clients check the name they connected to against the certificate's **Subject Alternative Name**
(SAN) extension. One SAN certificate can list several names, as the portal's does. The old
common name (CN) field is no longer used for this check; the CA/Browser Forum's Baseline
Requirements, which govern public CAs, mark it "not recommended". A **wildcard** name such as
`*.example.test` covers exactly one label at that position:

```console
$ openssl x509 -in portal.pem -noout -checkhost billing.example.test
Hostname billing.example.test does NOT match certificate
$ for h in portal.example.test a.b.example.test example.test; do openssl x509 -in wild.pem -noout -checkhost $h; done
Hostname portal.example.test does match certificate
Hostname a.b.example.test does NOT match certificate
Hostname example.test does NOT match certificate
```

Wildcards are convenient, but every server that shares one also shares its private key, so one
compromised server exposes them all.

## Expiry

An expired certificate stops clients connecting, which makes expiry a common cause of outages.
Public certificate lifetimes are shrinking under CA/Browser Forum ballot SC-081: at most 200 days
for certificates issued since 15 March 2026, 100 days from 15 March 2027, and 47 days from 15
March 2029. Renewal must therefore be automated, and monitored: `openssl x509 -checkend SECONDS`
exits non-zero if the certificate expires within that time, which a scheduled check can alert on.

## Revocation: CRL, OCSP and stapling

A certificate whose key is stolen must stop being trusted before it expires. The CA **revokes**
it and publishes that fact:

- A **certificate revocation list** (CRL) is a signed list of revoked serial numbers, published at
  an address written in each certificate.
- The **Online Certificate Status Protocol** (OCSP, RFC 6960) lets a client ask the CA about one
  certificate. It reveals to the CA which sites each user visits, and when the responder is
  unreachable, browsers usually skip the check.
- **OCSP stapling** has the server fetch a signed, time-stamped OCSP response and attach
  ("staple") it to the TLS handshake, which fixes the privacy and availability problems.

Practice is moving back to CRLs. Since March 2024 the Baseline Requirements make OCSP optional for
public CAs and require CRLs, and Let's Encrypt, citing privacy, switched off its OCSP service in
August 2025. Revoking in the private PKI:

```console
$ openssl ca -config ca.cnf -revoke portal.pem -crl_reason keyCompromise
Using configuration from ca.cnf
Adding Entry with serial number 575F1BF7AE0871B3CAA046E0027FCB15C6F5FB6C to DB for /O=Example Clinics/CN=portal.example.test
Revoking Certificate 575F1BF7AE0871B3CAA046E0027FCB15C6F5FB6C.
Database updated
$ openssl ca -config ca.cnf -gencrl -out crl.pem
Using configuration from ca.cnf
$ openssl verify -crl_check -CAfile root.pem -untrusted int.pem -CRLfile crl.pem portal.pem
O = Example Clinics, CN = portal.example.test
error 23 at 0 depth lookup: certificate revoked
error portal.pem: verification failed
```

## Reading certificates in Python

The `cryptography` package reads the same fields, which is how monitoring scripts audit many
certificates at once. This one checks names, key size, signature hash, self-signing and days left
at an audit time of 20 March 2027:

```python
from datetime import datetime, timezone

from cryptography import x509

AUDIT_TIME = datetime(2027, 3, 20, tzinfo=timezone.utc)

for name in ["portal.pem", "wild.pem", "root.pem"]:
    with open(name, "rb") as f:
        cert = x509.load_pem_x509_certificate(f.read())
    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        names = san.value.get_values_for_type(x509.DNSName)
    except x509.ExtensionNotFound:
        names = []
    days_left = (cert.not_valid_after_utc - AUDIT_TIME).days
    print(name, names, cert.public_key().key_size, cert.signature_hash_algorithm.name,
          cert.issuer == cert.subject, days_left)
```

```text
portal.pem ['portal.example.test', 'records.example.test'] 256 sha256 False 24
wild.pem ['*.example.test'] 256 sha256 False -66
root.pem [] 384 sha256 True 3494
```

The portal certificate expires in 24 days and the wildcard expired 66 days ago. An audit would
also flag RSA keys under 2048 bits and SHA-1 or MD5 signatures.

## Common mistakes

- **Not sending the intermediate certificate,** so clients fail with error 20.
- **Trusting the CN instead of the SAN,** or a certificate with no SAN at all.
- **Renewing by hand** from calendar reminders as lifetimes shrink toward 47 days.
- **Sending the private key to the CA** instead of a CSR.
- **Clicking through self-signed warnings** in production, which trains users to accept an
  attacker's certificate too.
- **One wildcard on many servers,** spreading one private key everywhere.

## Practice

1. Which certificate in the chain is the root of trust, and how can you tell from its fields?
2. Does `*.records.example.test` match `records.example.test`? Does it match
   `eu.records.example.test`?
3. A server's private key was copied by an attacker. What must happen to its certificate, and how
   do clients learn about it?
4. A certificate issued on 1 April 2027 is valid for 365 days. What is wrong with it?

### Answers

1. The root CA: its issuer equals its subject (it is self-signed) and it is in the trust store.
2. No (a wildcard needs exactly one label in its place); yes.
3. The CA revokes it and lists its serial number on the next CRL (and in OCSP responses where
   offered); a new key and certificate are issued.
4. A publicly trusted TLS certificate issued then may be valid for at most 100 days, so no public
   CA may issue it. (A private CA is not bound by that rule.)

## Key takeaways

- An X.509 certificate binds a name to a public key with a CA's signature; check SANs, not CN.
- A CSR carries the public key and names; the private key stays with the applicant.
- Trust flows from a self-signed root through intermediates; servers must send intermediates.
- Revocation uses CRLs and OCSP (with stapling); public CAs now must publish CRLs.
- Public certificate lifetimes are 200 days now, falling to 47 by 2029: automate and monitor
  renewal.

## Further reading

- [RFC 5280, Internet X.509 PKI Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280)
- [CA/Browser Forum TLS Baseline Requirements](https://cabforum.org/working-groups/server/baseline-requirements/requirements/)
- [Let's Encrypt: Ending OCSP Support in 2025](https://letsencrypt.org/2024/12/05/ending-ocsp/)
- [cryptography documentation: X.509 reference](https://cryptography.io/en/latest/x509/reference/)
