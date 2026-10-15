---
title: Secure Protocols and TLS
summary: Replace cleartext protocols with their secure versions and configure TLS well (SY0-801 objective 1.3). Learn HTTPS, SSH, SFTP, LDAPS and DNS over HTTPS, follow a real TLS 1.3 handshake in OpenSSL and Python, read cipher suite names, and know which versions and suites to disable under RFC 8996 and RFC 9325.
minutes: 35
objectives:
  - Name the secure replacement and port for common cleartext protocols
  - Explain how a TLS handshake authenticates the server and creates session keys
  - Read TLS 1.2 and TLS 1.3 cipher suite names
  - Write a TLS configuration that disables deprecated versions and weak cipher suites
---

## Outline

1. Cleartext protocols and their replacements
2. What TLS does
3. A real handshake
4. Cipher suites
5. What to disable

This lesson covers the protocols and transport/communication encryption bullets of SY0-801
objective 1.3, and puts lessons 5 to 9 together: hashing, symmetric encryption, key exchange,
signatures and certificates all meet in one TLS connection.

## Cleartext protocols and their replacements

Many protocols designed in the early internet send everything, passwords included, in
**cleartext**: anyone on the path (a shared Wi-Fi, a compromised router) can read and alter it.
Each has a secure replacement:

| Cleartext protocol (port) | Secure replacement (port) | How it is protected |
| --- | --- | --- |
| HTTP (80) | HTTPS (443) | HTTP inside TLS |
| Telnet (23), rlogin | SSH (22) | Secure Shell's own encrypted, authenticated channel |
| FTP (21) | SFTP (22) or FTPS (990) | SFTP runs over SSH; FTPS is FTP inside TLS |
| LDAP (389) | LDAPS (636), or StartTLS on 389 | LDAP inside TLS |
| DNS (53) | DNS over HTTPS (443), DNS over TLS (853) | Queries inside HTTPS (RFC 8484) or TLS |
| SMTP (25, and 587 for submission) | STARTTLS on both, or implicit TLS on 465 | Mail inside TLS |
| POP3 (110), IMAP (143) | POP3S (995), IMAPS (993) | Mailbox access inside TLS |
| SNMP v1 and v2c (161) | SNMPv3 with authPriv | Authentication and encryption in SNMP itself |

A few notes. **SFTP** (SSH File Transfer Protocol) is not FTP at all; it is a file transfer
subsystem of SSH, so one port and one set of keys cover both shell and files. **LDAPS** matters
because directory logins (LDAP binds) otherwise send passwords in the clear. **DNS over HTTPS**
(DoH) hides which names a device looks up from everyone on the path, though the chosen resolver
still sees them. **STARTTLS** upgrades a cleartext connection to TLS; if an attacker can strip the
upgrade offer, the client continues in cleartext, so servers and clients should require it.

SSH authenticates the server by its **host key**. On first connection the client shows the key's
fingerprint and stores it in `~/.ssh/known_hosts`; a later change produces a loud warning, which
should be investigated, not bypassed.

## What TLS does

**TLS** (Transport Layer Security, successor of the long-dead SSL) gives a connection three
properties:

- **Authentication** of the server (and optionally the client) through its certificate (lesson 9)
  and a signature made with the certificate's private key during the handshake.
- **Confidentiality** with an AEAD cipher such as AES-GCM or ChaCha20-Poly1305 (lesson 6).
- **Integrity** of every record through the AEAD tag.

The **handshake** sets this up. In TLS 1.3 (RFC 8446): the client sends a ClientHello with the
versions, cipher suites and key shares it supports; the server answers with its choice and its
own key share; both derive session keys with ephemeral (EC)DHE, giving forward secrecy (lesson 7).
The server then sends its certificate, encrypted, and a signature over the whole handshake, which
proves it holds the private key and that nobody altered the negotiation. The client checks the
chain, the hostname against the SAN, and the dates. All of this takes one round trip.

## A real handshake

OpenSSL can run both ends on one machine. With a test server listening on port 8443:

```console
$ openssl s_client -connect 127.0.0.1:8443 -servername portal.example.test -CAfile srv.pem </dev/null 2>/dev/null | grep -E "^(Peer signature type|Server Temp Key|Verify return code)|^New"
Peer signature type: ECDSA
Server Temp Key: X25519, 253 bits
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Verify return code: 0 (ok)
```

The server signed with ECDSA, the ephemeral key exchange used X25519, and the record cipher is
AES-256-GCM. Python's `ssl` module, on OpenSSL 3.5, can do the same in memory and shows more:

```python
import ssl


def handshake(client_ctx, server_ctx, hostname):
    """Run a TLS handshake between two in-memory endpoints; no network needed."""
    c_in, c_out, s_in, s_out = (ssl.MemoryBIO() for _ in range(4))
    client = client_ctx.wrap_bio(c_in, c_out, server_hostname=hostname)
    server = server_ctx.wrap_bio(s_in, s_out, server_side=True)
    done = {client: False, server: False}
    while not all(done.values()):
        for end in (client, server):
            if not done[end]:
                try:
                    end.do_handshake()
                    done[end] = True
                except ssl.SSLWantReadError:
                    pass
        s_in.write(c_out.read())
        c_in.write(s_out.read())
    return client


server_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
server_ctx.load_cert_chain("portal.pem", "portal.key")
client_ctx = ssl.create_default_context(cafile="ca.pem")
print("client minimum version:", client_ctx.minimum_version.name)

tls = handshake(client_ctx, server_ctx, "portal.example.test")
print(tls.version(), tls.cipher()[0], tls.group())

for host in ["portal.example.test", "evil.example.test"]:
    try:
        handshake(client_ctx, server_ctx, host)
        print(host, "-> verified")
    except ssl.SSLCertVerificationError as error:
        print(host, "->", error.verify_message)

old_server = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
old_server.load_cert_chain("portal.pem", "portal.key")
old_server.maximum_version = ssl.TLSVersion.TLSv1_1
try:
    handshake(client_ctx, old_server, "portal.example.test")
except ssl.SSLError as error:
    print("server limited to TLS 1.1 ->", error.reason)
```

```text
client minimum version: TLSv1_2
TLSv1.3 TLS_AES_256_GCM_SHA384 X25519MLKEM768
portal.example.test -> verified
evil.example.test -> Hostname mismatch, certificate is not valid for 'evil.example.test'.
/tmp/work/handshake.py:40: DeprecationWarning: ssl.TLSVersion.TLSv1_1 is deprecated
  old_server.maximum_version = ssl.TLSVersion.TLSv1_1
server limited to TLS 1.1 -> NO_PROTOCOLS_AVAILABLE
```

Four lessons in one run. The default client context refuses anything below TLS 1.2. The key
exchange group is **X25519MLKEM768**, the hybrid post-quantum exchange from lesson 7. A
certificate valid for `portal` is rejected for `evil`, which is what stops an on-path attacker
with a stolen certificate for some other name. And a server that offers only TLS 1.1 cannot talk
to a modern client at all.

## Cipher suites

A **cipher suite** names the algorithms a connection uses. TLS 1.2 names list all four parts;
OpenSSL's spelling of the TLS 1.2 suite it negotiated with the same server was:

```text
ECDHE-ECDSA-AES256-GCM-SHA384
  ECDHE      key exchange: ephemeral elliptic-curve Diffie-Hellman (forward secrecy)
  ECDSA      authentication: the certificate's key type
  AES256-GCM bulk cipher: AES with a 256-bit key in GCM (AEAD)
  SHA384     hash for the key derivation function
```

TLS 1.3 negotiates key exchange and authentication separately, so its suites name only the AEAD
cipher and hash, and only five exist; the three in common use are `TLS_AES_128_GCM_SHA256`,
`TLS_AES_256_GCM_SHA384` and `TLS_CHACHA20_POLY1305_SHA256`. TLS 1.3 also removed static RSA key
exchange, CBC ciphers, compression, renegotiation and SHA-1 signatures.

## What to disable

RFC 8996 deprecated **TLS 1.0 and 1.1** in 2021: they rely on SHA-1 in the handshake and cannot use
AEAD ciphers. RFC 9325 (BCP 195) says implementations must not negotiate SSL 2.0, SSL 3.0, TLS 1.0
or 1.1, must support TLS 1.2 and should support TLS 1.3, must not negotiate NULL encryption, RC4 or
any suite under 112 bits of security (which excludes export-grade suites), should not negotiate
static RSA key exchange, and should prefer AEAD suites with forward secrecy. NIST SP 800-52 Rev. 2
required US government servers to support TLS 1.3 by 2024. A typical nginx configuration:

```text
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
add_header Strict-Transport-Security "max-age=63072000" always;
```

The last line sends **HSTS** (HTTP Strict Transport Security): the browser remembers to use only
HTTPS for this site, which defeats attacks that strip HTTPS links back to HTTP.

## Common mistakes

- **Leaving TLS 1.0 and 1.1 enabled "for compatibility"** long after the clients that needed them
  are gone.
- **Disabling certificate verification** (`verify=False`, `CERT_NONE`) to silence an error, which
  makes TLS useless against on-path attackers.
- **Optional STARTTLS,** which an attacker downgrades to cleartext.
- **Confusing SFTP and FTPS,** and opening the wrong ports for each.
- **Accepting a changed SSH host key** without checking why it changed.

## Practice

1. A directory server accepts logins on port 389 with no StartTLS. What is the risk and what
   should be enabled?
2. Break down `ECDHE-RSA-AES128-GCM-SHA256`.
3. Which of these should be disabled: TLS 1.2 with `ECDHE-RSA-AES256-GCM-SHA384`, TLS 1.0,
   `AES128-SHA` (static RSA, CBC), RC4?
4. What does HSTS protect against?

### Answers

1. Passwords cross the network in cleartext. Require LDAPS on 636 (or mandatory StartTLS).
2. Ephemeral elliptic-curve Diffie-Hellman key exchange, RSA certificate for authentication,
   AES-128 in GCM mode for the records, SHA-256 for key derivation.
3. TLS 1.0, `AES128-SHA` (no forward secrecy, CBC) and RC4. The first is a recommended suite.
4. SSL stripping: an attacker downgrading the browser's first request to plain HTTP.

## Key takeaways

- Replace cleartext protocols: HTTPS, SSH, SFTP, LDAPS, DoH or DoT, mail over TLS, SNMPv3.
- TLS authenticates the server with its certificate, agrees on keys with ephemeral key exchange,
  and protects records with AEAD.
- TLS 1.3 suites name only cipher and hash; TLS 1.2 names list key exchange, authentication,
  cipher and hash.
- Disable SSL, TLS 1.0 and 1.1, NULL, RC4, export and static RSA suites; enable HSTS.

## Further reading

- [RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/rfc/rfc8446)
- [RFC 9325, Recommendations for Secure Use of TLS and DTLS](https://www.rfc-editor.org/rfc/rfc9325)
- [RFC 8996, Deprecating TLS 1.0 and TLS 1.1](https://www.rfc-editor.org/rfc/rfc8996)
- [Python documentation: ssl](https://docs.python.org/3.15/library/ssl.html)
