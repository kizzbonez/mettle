---
title: Application and Code Vulnerabilities
summary: Weaknesses in code and the attacks that use them, explained so you can recognize, prevent and fix them, from race conditions (time-of-check/time-of-use), malicious updates, hardcoded secrets and unsafe exception handling to injection, buffer overflow, replay, privilege escalation, request forgery and directory traversal (SY0-801 objectives 2.4 and 2.5).
minutes: 40
objectives:
  - Show how SQL injection works and fix it with a parameterized query
  - Explain a time-of-check/time-of-use race and close it by checking and using in one step
  - Recognize hardcoded secrets, fail-open exception handling and malicious updates, and name their fixes
  - Identify buffer overflow, replay, privilege escalation, CSRF, SSRF and directory traversal attempts in logs
---

## Outline

1. Injection
2. Race conditions
3. Unsafe exception handling and hardcoded secrets
4. Malicious updates
5. Memory, replay and privilege escalation
6. Request forgery and directory traversal
7. Reading the attacks in a web log

## Injection

**Injection** happens when data crosses into a place where it is read as code: an SQL query, a
shell command, an LDAP filter, or HTML (cross-site scripting, XSS). It is A05 in the OWASP Top 10
2025, and the MOVEit Transfer zero-day of 2023 (CVE-2023-34362, CWE-89) was an SQL injection.
The classic probe shows why string building fails:

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE bookings (ref TEXT, name TEXT, card_last4 TEXT)")
db.executemany("INSERT INTO bookings VALUES (?, ?, ?)",
               [("AB12", "Priya Shah", "4417"), ("CD34", "Tom Reyes", "9021")])

ref = "AB12' OR '1'='1"                      # a classic probe typed into the booking form

unsafe = f"SELECT name, card_last4 FROM bookings WHERE ref = '{ref}'"
print("unsafe:", db.execute(unsafe).fetchall())

safe = db.execute("SELECT name, card_last4 FROM bookings WHERE ref = ?", (ref,)).fetchall()
print("parameterized:", safe)
```

```text
unsafe: [('Priya Shah', '4417'), ('Tom Reyes', '9021')]
parameterized: []
```

The quote closed the string and `OR '1'='1'` made the condition true for every row. With a
placeholder, the database receives the value separately from the query, so it can only ever be a
value: no booking has that odd reference. Fixes for every kind of injection follow the same idea:
parameterized queries, argument lists instead of shell strings, output encoding for HTML, and
allow-list input validation as a second layer.

## Race conditions

A **race condition** is a bug whose outcome depends on timing. The security form is
**time-of-check/time-of-use (TOCTOU)**: a program checks something (time of check, TOC), then
acts on it later (time of use, TOU), and an attacker changes it in between. Here a service
refuses symbolic links, then reads the file; another process swaps the file for a link to a
secret in the gap:

```python
import os
import tempfile
from pathlib import Path

work = Path(tempfile.mkdtemp())
secret = work / "shadow"
secret.write_text("root:$y$j9T$secret-hash\n")
upload = work / "upload.txt"


def reset():
    upload.unlink(missing_ok=True)
    upload.write_text("harmless report\n")


def swap():                                  # what another process does in the gap
    upload.unlink()
    upload.symlink_to(secret)


def unsafe_read(path, meanwhile):
    if path.is_symlink():                    # time of check
        raise PermissionError("links not allowed")
    meanwhile()
    return path.read_text()                  # time of use: may be a different file now


def safe_read(path, meanwhile):
    meanwhile()
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)   # check and use in one step
    with os.fdopen(fd) as f:
        return f.read()


reset()
print("unsafe:", unsafe_read(upload, swap), end="")
reset()
try:
    safe_read(upload, swap)
except OSError as error:
    print("safe: refused,", error.strerror)
```

```text
unsafe: root:$y$j9T$secret-hash
safe: refused, Too many levels of symbolic links
```

The fix makes the check part of the use: `O_NOFOLLOW` refuses a link at the moment of opening.
The same pattern applies elsewhere: database transactions and locks for "check the balance, then
debit", atomic file creation, and checking permissions on the open file handle rather than the
name. CVE-2025-22224, the VMware escape in the previous lesson, is a TOCTOU (CWE-367).

## Unsafe exception handling and hardcoded secrets

**Unsafe exception handling** takes two forms. One leaks: stack traces, SQL errors and file paths
shown to users tell attackers how the system is built (CWE-209). The other **fails open**: an
error lands the program in a less secure state (CWE-636). OWASP added "Mishandling of Exceptional
Conditions" as A10 in its 2025 list.

```python
acl = {"rota": {"priya", "tom"}}             # "payroll" is missing: a configuration error


def can_read_open(user, resource):
    try:
        return user in acl[resource]
    except Exception:
        return True                          # fails open: any error grants access


def can_read_closed(user, resource):
    try:
        return user in acl[resource]
    except KeyError:
        print(f"no ACL for {resource!r}; denying")   # log the detail, show the user nothing
        return False                         # fails closed


print(can_read_open("mallory", "payroll"))
print(can_read_closed("mallory", "payroll"))
```

```text
True
no ACL for 'payroll'; denying
False
```

**Hardcoded secrets** (CWE-798) are passwords, API keys and tokens written into source code or
configuration files, so everyone with the code, every backup and every leaked repository has
them, and rotating them needs a release. Keep them in a secrets manager, inject them at run time,
and scan repositories for them.

## Malicious updates

A **malicious update** is a legitimate update channel delivering attacker code, so it arrives
trusted and signed. SolarWinds Orion (2020) shipped a backdoor in signed updates. In March 2024
a developer noticed slow SSH logins and found that the upstream release tarballs of the xz
compression library, from version 5.6.0, carried a backdoor planted by a co-maintainer who had
spent about two years earning the project's trust (CVE-2024-3094, CWE-506, embedded malicious
code). Defenses: verify signatures and hashes,
prefer reproducible builds, pin versions, stage rollouts to a few systems first, and watch what
updated software does.

## Memory, replay and privilege escalation

- **Buffer overflow** (CWE-787, out-of-bounds write): code in C or C++ writes past the end of a
  buffer and overwrites neighboring memory, including return addresses, which can redirect
  execution. Signs: crashes, and protections firing (glibc prints `stack smashing detected`).
  Defenses: memory-safe languages, bounds-checked functions, and the OS protections ASLR (address
  randomization), DEP/NX (non-executable data) and stack canaries.
- **Replay**: capturing a valid message, such as a login, a token or a signed payment request, and
  sending it again. Defenses: TLS, one-time nonces, timestamps with short validity, and sequence
  numbers (Kerberos rejects authenticators whose timestamps fall outside a few minutes).
- **Privilege escalation**: gaining rights you were not given. **Vertical** means user to
  administrator, through an OS flaw or a misconfiguration such as a writable service binary.
  **Horizontal** means reaching another user's data at the same level, such as changing
  `/api/bookings/10442` to `10443` (an insecure direct object reference). Check authorization on
  every request, server side.

## Request forgery and directory traversal

- **Cross-site request forgery (CSRF)**: a malicious page makes the victim's browser send a
  request to a site where they are logged in, and the browser adds the cookie. Defenses (OWASP):
  synchronizer tokens, `SameSite` cookies, and checking the `Sec-Fetch-Site` header.
- **Server-side request forgery (SSRF)**: the server is tricked into fetching a URL the attacker
  chooses, often internal, such as the cloud metadata service at `169.254.169.254`, which can
  return credentials. Defenses: allow lists of destinations, blocking internal ranges, and AWS's
  IMDSv2, which requires a session token obtained with a `PUT` request that a simple SSRF cannot
  make.
- **Directory traversal** (CWE-22): `../` sequences in a file name climb out of the intended
  folder. CVE-2021-41773 in Apache HTTP Server 2.4.49 let encoded dots (`.%2e/`) through.
  Defense: resolve the path and confirm it is still inside the base folder.

## Reading the attacks in a web log

```text
198.51.100.61 - - [16/Oct/2026:03:12:44 +0000] "GET /cgi-bin/.%2e/.%2e/.%2e/.%2e/etc/passwd HTTP/1.1" 400 226 "-" "curl/8.5.0"
198.51.100.61 - - [16/Oct/2026:03:12:45 +0000] "GET /booking?ref=AB12%27%20OR%20%271%27%3D%271 HTTP/1.1" 500 1180 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
203.0.113.14 - - [16/Oct/2026:03:20:02 +0000] "GET /fetch?url=http://169.254.169.254/latest/meta-data/iam/ HTTP/1.1" 200 54 "-" "Mozilla/5.0"
```

Line one is the Apache traversal probe; the 400 says it failed. Line two decodes to the SQL probe
above, from a well-known injection tool, and the **500** says the application crashed on it:
check whether it is vulnerable and whether the error page leaks details. Line three is SSRF, and
the **200** means the server fetched the metadata path: treat the instance's credentials as
stolen.

## Common mistakes

- Escaping quotes by hand instead of using placeholders.
- Checking a file or a balance, then using it later without a lock or an atomic operation.
- `except Exception: return True`, or returning stack traces to users.
- Removing a hardcoded key from the code without rotating it.

## Practice

1. Which line of the SQL example would you change, and to what, if the query used `LIKE` to search
   names?
2. A log shows `GET /download?file=..%2F..%2F..%2Fetc%2Fpasswd` answered with 200 and 1,184
   bytes. What is it, and what does the status suggest?
3. A user changes `invoice=7781` to `invoice=7782` in the URL and sees another customer's invoice.
   Which attack, and which fix?

### Answers

1. Keep the placeholder and put the wildcards in the value: `WHERE name LIKE ?` with
   `("%" + term + "%",)`.
2. Directory traversal (`%2F` is `/`). The 200 with a file-sized body suggests it worked: check the
   response and the code, then fix the path handling.
3. Horizontal privilege escalation through an insecure direct object reference. Check on the
   server that the logged-in user owns invoice 7782 before returning it.

## Key takeaways

- Injection is data read as code; parameterize, encode and validate.
- TOCTOU races are closed by checking and using in one atomic step.
- Fail closed, log details privately, and keep secrets out of code.
- Updates can be weapons; verify, pin and stage them.
- Overflow, replay, privilege escalation, CSRF, SSRF and traversal each have a recognizable trace
  and a specific fix.

## Further reading

- [OWASP Top 10:2025](https://top10.owasp.org/2025)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CWE-636: Not Failing Securely ('Failing Open')](https://cwe.mitre.org/data/definitions/636.html)
- [AWS: Use the Instance Metadata Service (IMDSv2)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
