---
title: DNS and HTTP from the Shell
summary: Follow how Linux turns a name into an address, query DNS servers directly with dig and host, and make, inspect and debug HTTP requests with curl.
minutes: 25
objectives:
  - Explain the lookup order set by `/etc/nsswitch.conf`, `/etc/hosts` and `/etc/resolv.conf`
  - Query a chosen DNS server for a chosen record type with `dig`, and read the status and TTL
  - Explain why `dig` and `getent` can give different answers for the same name
  - Use `curl` to show response headers, follow redirects, send data and fail on HTTP errors in scripts
---

## Outline

1. How a name becomes an address
2. The local files
3. Asking DNS directly
4. HTTP in one minute
5. curl for administrators

## How a name becomes an address

The **Domain Name System (DNS)** is the distributed database that maps names to data. The
answers are **records** of different types: **A** (an IPv4 address), **AAAA** (IPv6), **CNAME**
(an alias for another name), **MX** (the mail servers of a domain), **NS** (the servers that
are authoritative for a zone), **TXT** (free text, used for mail policies and domain
verification) and **PTR** (reverse lookup, address to name). Every record carries a **TTL**,
time to live, in seconds: how long others may cache it. That is why a changed record can take
hours to be seen everywhere.

Your machine does not usually walk the DNS tree itself. It sends the question to a **recursive
resolver** (the router, the provider, or a public service), which asks the **authoritative**
servers on its behalf and caches the answer.

## The local files

Programs do not talk to DNS directly either. They call the C library, which follows the
**Name Service Switch** in `/etc/nsswitch.conf`. Its `hosts:` line gives the sources in order:

```text
hosts:          files dns
```

`files` means `/etc/hosts`, a plain table of address and names, checked first; `dns` means the
servers in `/etc/resolv.conf`:

```text
# /etc/resolv.conf
nameserver 10.20.0.2
nameserver 10.20.0.3
search corp.example.com
options timeout:2 attempts:2
```

The resolver library uses at most three `nameserver` lines and tries them in order. `search`
lets you type `db02` and have `db02.corp.example.com` tried. On many current systems
`/etc/resolv.conf` is written by something else, such as NetworkManager or **systemd-resolved**,
a local caching resolver that appears there as `nameserver 127.0.0.53`; then
`resolvectl status` shows the real upstream servers, and edits to the file are overwritten.

`getent hosts` asks exactly the way every program does, through the Name Service Switch, so it
sees `/etc/hosts`. It runs in the sandbox, which has no network but has a hosts file:

```bash
grep '^hosts:' /etc/nsswitch.conf
getent hosts localhost
```

```text
hosts:          files dns
::1             localhost ip6-localhost ip6-loopback
```

## Asking DNS directly

`dig` sends a DNS query straight to a server and prints the full answer; it **does not read
`/etc/hosts`**. That difference is a diagnostic tool: if `getent hosts db02` and `dig db02`
disagree, a line in `/etc/hosts` (or another NSS source) is answering. On a typical system:

```bash
dig db02.corp.example.com A
dig +short corp.example.com MX
dig @10.20.0.3 +noall +answer db02.corp.example.com
dig -x 10.20.0.14 +short
```

```text
; <<>> DiG 9.18.28 <<>> db02.corp.example.com A
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 40711
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;db02.corp.example.com.		IN	A

;; ANSWER SECTION:
db02.corp.example.com.	2711	IN	A	10.20.0.14

;; Query time: 12 msec
;; SERVER: 10.20.0.2#53(10.20.0.2) (UDP)
```

Read the **status** first. `NOERROR` with an answer is success. `NXDOMAIN` means the name does not
exist, so look for a typo or a missing record. `SERVFAIL` means the resolver could not get an
answer, often a broken zone or a DNSSEC failure. `NOERROR` with no answer section means the name
exists but has no record of that type. In the answer, `2711` is the remaining TTL. `SERVER` tells you who
answered. `@server` asks a specific server, which is how you check a change at the authoritative
server before caches expire, or compare your resolver with a public one. `+short` prints only the
data, `-x` does a reverse (PTR) lookup, and `+trace` follows the delegation from the root servers
down. `host example.com` and `host -t MX example.com` give the same answers in a shorter form.

Typical name problems: a wrong or unreachable `nameserver`; a stale line in `/etc/hosts`; a
missing `search` domain, so short names fail; and an old cached answer, which `dig @authoritative`
reveals.

## HTTP in one minute

**HTTP** is a text protocol of requests and responses over TCP (port 80), or over TLS for
**HTTPS** (port 443). A request has a **method** (`GET` to read, `POST` to submit, `PUT`,
`DELETE`, `HEAD` for headers only), a path, and **headers** such as `Host:` and
`Authorization:`. A response starts with a **status code**: `2xx` success (200 OK), `3xx`
redirect (301 and 302, with a `Location:` header), `4xx` client error (401 not authenticated, 403
forbidden, 404 not found) and `5xx` server error (500, 502 bad gateway, 503 unavailable, 504
gateway timeout). For a proxy such as nginx, 502 and 504 point at the application behind it.

## curl for administrators

`curl` transfers data to or from a URL and is the standard way to test a web service from a
terminal. On a typical system:

```bash
curl -I https://example.org/old-page
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://example.org/
```

```text
HTTP/2 301
location: https://example.org/new-page
content-type: text/html
cache-control: max-age=3600

200 0.184213s
```

- `-I` sends a `HEAD` request and shows only the headers; `-i` shows headers and body together;
  `-v` shows the whole conversation, including the TLS handshake and the request headers sent.
- `-L` follows redirects. Without it you get the 301 itself, as above.
- `-o file` saves the body (`-O` uses the remote file name); `-s` hides the progress meter and
  `-S` still shows errors.
- `-w` prints chosen facts after the transfer: `%{http_code}` and `%{time_total}` make a quick
  health check.
- `-H 'Accept: application/json'` adds a header; `-X POST -d 'a=1'` sends form data;
  `--json '{"a":1}'` (recent versions) sends JSON with the right headers; `-u user` asks for a
  password for basic authentication.
- `--resolve www.example.org:443:10.20.0.15` sends the request to a chosen address while keeping
  the name, so you can test a new server before changing DNS.
- `-m 10` gives up after ten seconds instead of hanging a script.

The trap for scripts: by default curl exits with status 0 for **any** HTTP response, including
404 and 500, because the transfer itself worked. `-f` (`--fail`) makes it exit with code 22 on a
status of 400 or more. `-k` (`--insecure`) skips certificate checks; use it only to diagnose, never
in a script, since it accepts any impostor. Headers saved with `curl -sS -D headers.txt -o
/dev/null URL` are easy to examine in the sandbox; HTTP lines end in `\r\n`, so strip the
carriage returns first:

```bash
tr -d '\r' < headers.txt | awk 'NR == 1 { print "status:", $2 } tolower($1) == "location:" { print "redirects to:", $2 }'
```

```text
status: 301
redirects to: https://www.example.org/
```

## Common mistakes

- Testing a name with `dig` and forgetting that `/etc/hosts` can override it for every other program.
- Editing `/etc/resolv.conf` on a system where NetworkManager or systemd-resolved regenerates it.
- Expecting a DNS change to be visible at once, ignoring the old record's TTL.
- `curl` in a script without `-f`, so a 500 page is treated as success and saved as data.
- `curl -k` left in scripts, or `-L` forgotten when checking a URL that redirects.

## Practice

1. `ping db02` reaches `10.20.0.99`, but `dig +short db02.corp.example.com` prints `10.20.0.14`. What explains it?
2. Write a command that prints only the HTTP status code of `https://intranet.example.com/health`, giving up after 5 seconds.
3. You moved `www.example.org` to a new server at `10.20.0.15` but DNS still points to the old one. How do you test the new server over HTTPS by name?

### Answers

1. Another Name Service Switch source answers before DNS, almost always a stale line in
   `/etc/hosts`. `getent hosts db02` shows what programs see; fix or remove the hosts entry.
2. `curl -sS -o /dev/null -m 5 -w '%{http_code}\n' https://intranet.example.com/health`.
3. `curl -I --resolve www.example.org:443:10.20.0.15 https://www.example.org/`. The name, the TLS
   check and the `Host` header stay correct while the connection goes to the new address.

## Key takeaways

- Programs resolve names through `/etc/nsswitch.conf`: usually `/etc/hosts`, then DNS.
- `getent hosts` shows what programs see; `dig` shows what a DNS server says.
- Read `dig` output by status first: `NOERROR`, `NXDOMAIN`, `SERVFAIL`.
- `curl -I`, `-v`, `-L` and `-w '%{http_code}'` cover most HTTP debugging.
- In scripts, use `curl -fsS` with a timeout so HTTP errors are errors.

## Further reading

- [resolv.conf(5) manual page](https://man7.org/linux/man-pages/man5/resolv.conf.5.html)
- [nsswitch.conf(5) manual page](https://man7.org/linux/man-pages/man5/nsswitch.conf.5.html)
- [BIND 9 manual pages: dig and host](https://bind9.readthedocs.io/en/latest/manpages.html)
- [curl manual](https://curl.se/docs/manpage.html)
