---
title: Credential Attacks and Account Indicators
summary: How brute force, password spraying, credential stuffing, user enumeration, replay and MFA bypass (fatigue, SIM swap, token theft) work, how to tell them apart in authentication logs, and the account indicators that reveal them, account lockout, impossible travel and concurrent sessions (SY0-801 objective 2.5).
minutes: 35
objectives:
  - Distinguish brute force, password spraying and credential stuffing in authentication logs
  - Recognize user enumeration from error responses and Windows logon failure codes
  - Explain replay and the three main MFA bypasses, and the controls that defeat each
  - Detect impossible travel with a great-circle distance calculation
---

## Outline

1. Guessing: brute force, spraying and stuffing
2. Telling them apart in a log
3. User enumeration
4. Replay
5. MFA bypass
6. Account indicators

## Guessing: brute force, spraying and stuffing

Passwords are still the most attacked secret. MITRE ATT&CK files guessing under T1110, Brute Force,
with four sub-techniques:

- **Brute force (password guessing, T1110.001)**: many passwords against **one** account. Noisy,
  and stopped by lockout or throttling.
- **Password spraying (T1110.003)**: **one** common password (`Winter2026!`) against **many**
  accounts, a few attempts each, slowly. It stays under per-account lockout thresholds.
- **Credential stuffing (T1110.004)**: username and password pairs leaked from another site, tried
  here, because people reuse passwords. Each account sees one attempt, and many succeed.
- **Password cracking (T1110.002)**: guessing offline against stolen password hashes, which no
  login log can see. Slow, salted hashes (Security Foundations) are the defense.

NIST SP 800-63B-4 (2025) requires verifiers to limit consecutive failed attempts on one account
to no more than 100 and to check new passwords against a blocklist of breached and common ones.

## Telling them apart in a log

The attacks differ in the shape of the failures per source. This is an OpenSSH log from a jump
host:

```text
2026-10-16T02:10:05.104512+00:00 jump01 sshd[4101]: Failed password for root from 198.51.100.23 port 40101 ssh2
2026-10-16T02:10:09.381022+00:00 jump01 sshd[4102]: Failed password for root from 198.51.100.23 port 40102 ssh2
...
2026-10-16T03:17:35.662910+00:00 jump01 sshd[5205]: Failed password for eli.novak from 203.0.113.77 port 60035 ssh2
2026-10-16T03:19:13.340017+00:00 jump01 sshd[5206]: Failed password for invalid user farah from 203.0.113.77 port 60041 ssh2
2026-10-16T03:19:44.002918+00:00 jump01 sshd[5311]: Accepted password for farah.khan from 203.0.113.77 port 60188 ssh2
2026-10-16T08:01:12.880451+00:00 jump01 sshd[6020]: Failed password for ben.ito from 10.40.2.44 port 52011 ssh2
2026-10-16T08:01:20.113040+00:00 jump01 sshd[6020]: Accepted password for ben.ito from 10.40.2.44 port 52011 ssh2
```

```bash
# Per source IP: failed attempts, distinct accounts tried, most attempts on one account, accepted logins.
awk '/Failed password for/ { ip = $(NF-3); user = $(NF-5); fail[ip]++; per[ip " " user]++; if (per[ip " " user] == 1) users[ip]++ }
     /Accepted password for/ { ok[$(NF-3)] = ok[$(NF-3)] " " $(NF-5) }
     END { for (k in per) { split(k, p, " "); if (per[k] > top[p[1]]) top[p[1]] = per[k] }
           for (ip in fail) print ip, fail[ip], "fails,", users[ip], "accounts, max", top[ip], "on one; accepted:" (ok[ip] ? ok[ip] : " none") }' auth.log | sort
```

```text
10.40.2.44 1 fails, 1 accounts, max 1 on one; accepted: ben.ito
198.51.100.23 8 fails, 1 accounts, max 8 on one; accepted: none
203.0.113.77 6 fails, 6 accounts, max 1 on one; accepted: farah.khan
```

The fields are counted from the end of the line, so `invalid user farah` parses like any other.
198.51.100.23 is **brute force**: eight tries at `root`, none successful. 203.0.113.77 is
**password spraying**: one try each at six accounts, one every minute and a half, and then an
**accepted login** for `farah.khan`. That last line turns an attack into an incident: reset the
password, end the account's sessions and look at what it did. 10.40.2.44 is a person mistyping
once. Spraying spread over many addresses shows per account instead: many accounts each failing
once in the same hour.

## User enumeration

**User enumeration** is learning which usernames exist, so later guesses are not wasted. Systems
leak it through different answers: "unknown user" versus "wrong password", a faster response for
unknown users, or a password-reset page that says "no such account". OWASP's Authentication
Cheat Sheet recommends one generic message ("Invalid user ID or password") and the same work in
both cases. Windows records the difference in event 4625 (An account failed to log on):

```text
4625  Account Name: a.morgan    Status: 0xC000006D  Sub Status: 0xC0000064  Source: 198.51.100.90
4625  Account Name: b.morgan    Status: 0xC000006D  Sub Status: 0xC0000064  Source: 198.51.100.90
4625  Account Name: c.morgan    Status: 0xC000006D  Sub Status: 0xC0000064  Source: 198.51.100.90
4625  Account Name: d.morgan    Status: 0xC000006D  Sub Status: 0xC000006A  Source: 198.51.100.90
```

Microsoft documents 0xC0000064 as a logon with a misspelled or bad user account (several in a row
suggest enumeration) and 0xC000006A as a bad password. Three names that do not exist, then one
that does: `d.morgan` is now a confirmed target.

## Replay

A **replay** attack reuses captured authentication material instead of the password:
**pass-the-hash** (an NTLM hash sent as if it were the password), **pass-the-ticket** (a stolen
Kerberos ticket) and **pass-the-cookie** (a stolen web session cookie, T1550.004). Defenses:
protected credential stores, short token lifetimes, device-bound tokens, and disabling NTLM where
possible.

## MFA bypass

MFA stops most password attacks, so attackers attack the MFA:

- **MFA fatigue** (T1621, MFA Request Generation): with a valid password, the attacker triggers
  push prompt after push prompt until the user approves one. Uber's 2022 breach started this
  way, with a contractor's password bought after malware infected their device. Number matching
  (typing the number shown on screen), limits on prompts and alerts on repeated denials stop it.
- **SIM swap**: talking a mobile carrier into moving the victim's number to the attacker's SIM,
  which captures SMS codes and calls. CISA's advisory on Scattered Spider describes it. NIST
  SP 800-63B-4 restricts SMS and voice for this reason.
- **Token theft**: an adversary-in-the-middle phishing site relays the real login, MFA included,
  and keeps the session cookie; infostealers take cookies from the browser. The attacker never
  needs the second factor again.

The lasting answer is **phishing-resistant MFA**: NIST counts only cryptographic authenticators
bound to the real site's name or channel, such as FIDO2 security keys and passkeys, as phishing
resistant. A fake site cannot get a valid response, and there is no code to read out.

## Account indicators

- **Account lockout**: many lockouts (Windows event 4740) across accounts point to spraying or
  enumeration; lockout of one high-value account points to brute force or deliberate denial.
- **Impossible travel**: two successful sign-ins by one user, from places too far apart for the
  time between them.
- **Concurrent sessions**: one account active from two devices or countries at once, typical of
  a stolen session token.

Impossible travel is a distance-over-time check. With the haversine formula for great-circle
distance and a threshold of 900 km/h, about airliner speed:

```python
from datetime import datetime
from math import asin, cos, radians, sin, sqrt

signins = [  # user, time (UTC), city, latitude, longitude: successful sign-ins only
    ("farah.khan", "2026-10-16T08:05:00Z", "Southampton", 50.9097, -1.4044),
    ("farah.khan", "2026-10-16T09:40:00Z", "Bucharest", 44.4268, 26.1025),
    ("ben.ito", "2026-10-16T07:55:00Z", "Southampton", 50.9097, -1.4044),
    ("ben.ito", "2026-10-16T18:30:00Z", "New York", 40.7128, -74.0060),
]


def km_between(lat1, lon1, lat2, lon2):
    """Great-circle distance with the haversine formula, Earth radius 6371 km."""
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(a))


for (u1, t1, c1, la1, lo1), (u2, t2, c2, la2, lo2) in zip(signins, signins[1:]):
    if u1 != u2:
        continue
    hours = (datetime.fromisoformat(t2) - datetime.fromisoformat(t1)).total_seconds() / 3600
    km = km_between(la1, lo1, la2, lo2)
    verdict = "IMPOSSIBLE" if km > 900 * hours else "possible"
    print(f"{u1}: {c1} -> {c2}, {km:.0f} km in {hours:.2f} h = {km / hours:.0f} km/h, {verdict}")
```

```text
farah.khan: Southampton -> Bucharest, 2167 km in 1.58 h = 1369 km/h, IMPOSSIBLE
ben.ito: Southampton -> New York, 5506 km in 10.58 h = 520 km/h, possible
```

With the sprayed SSH password above, `farah.khan` is compromised. VPNs can place a real user far
away, so impossible travel is a strong signal to verify, not proof.

## Common mistakes

- Relying on per-account lockout alone; spraying is designed to stay under it.
- Telling users "unknown user" and "wrong password" with different messages.
- Approving MFA by push without number matching, or keeping SMS for administrators.
- Resetting a compromised password but leaving the attacker's session token valid.

## Practice

1. One IP fails once each against 300 accounts in an hour. Which attack, and which control would
   still catch it?
2. A user reports twenty MFA prompts at 3 a.m. that they did not request. What has the attacker
   already got, and what do you do?
3. Event 4625 shows Sub Status 0xC0000064 for 50 different names from one address. What is
   happening?
4. In the travel example, why is `ben.ito` not flagged?

### Answers

1. Password spraying. Detection across accounts (many accounts failing from one source or in one
   window), MFA, and banned-password lists that refuse `Winter2026!`.
2. The correct password. Tell the user to deny, reset the password, end sessions, and look for
   where the password came from (reuse, infostealer, phishing).
3. User enumeration: the names do not exist, and the attacker is learning which ones do.
4. 5506 km in 10.58 hours is 520 km/h, which a direct flight can do.

## Key takeaways

- Brute force hits one account many times; spraying hits many accounts a few times; stuffing
  replays leaked pairs. Generic errors stop user enumeration.
- Replay reuses hashes, tickets and cookies; MFA fatigue, SIM swap and token theft bypass MFA.
- Phishing-resistant MFA (FIDO2, passkeys) defeats phishing and fatigue.
- Lockouts, impossible travel and concurrent sessions are the account indicators to watch.

## Further reading

- [MITRE ATT&CK: Brute Force (T1110)](https://attack.mitre.org/techniques/T1110/)
- [MITRE ATT&CK: Multi-Factor Authentication Request Generation (T1621)](https://attack.mitre.org/techniques/T1621/)
- [NIST SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Microsoft Learn: Event 4625, An account failed to log on](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625)
