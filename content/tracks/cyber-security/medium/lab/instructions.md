Write `solution.py` in Python. The standard library is enough (`csv`, `re`, `datetime`,
`urllib.parse`, `collections`); pandas is available if you prefer it, but every function returns
plain Python lists, dicts and strings as described. Keep the five function names and parameters
from the starter; you may add helpers. `km_between` is already written for you. Each path
argument is a file path (a `str` or a `pathlib.Path`).

1. **`ssh_attacks(path)`** reads an SSH log and classifies its source addresses.
   - Only two kinds of line count. A **failure** contains
     `sshd[<pid>]: Failed <method> for <user> from <ip> port <n> ssh2`, and an **acceptance**
     contains `sshd[<pid>]: Accepted <method> for <user> from <ip> port <n> ssh2`. The user may
     be written `invalid user <name>` (the account is then `<name>`), and text may follow `ssh2`.
     Every other line (`Invalid user ...`, `Connection closed ...`, `pam_unix ...`) is ignored.
   - For each source IP that has failures: `failures` is its number of failure lines,
     `accounts` the number of distinct users in them, and `top` the largest number of failures
     against any one user.
   - The IP is **`brute-force`** if `top >= 10`, otherwise **`password-spraying`** if
     `accounts >= 5` and `top <= 3`. Any other IP is not reported.
   - Return a list of dicts `{"ip", "kind", "failures", "accounts", "accepted"}`, where
     `accepted` is the sorted list of distinct users with an acceptance from that IP anywhere in
     the log (empty if none). Order: `failures` highest first, then `ip` as text (string order).
2. **`impossible_travel(path, max_kmh=900, min_km=500)`** reads a sign-in CSV with the columns
   `time,user,result,ip,city,country,lat,lon,app`; `time` is like `2026-10-14T07:58:03Z` (UTC).
   - Use only rows whose `result` is `success`. Sort each user's sign-ins by time (the file is
     not in order) and compare each sign-in with the user's **next** one.
   - `km` is `km_between` of the two coordinates and `hours` the time between them. Flag the
     pair if `km >= min_km` **and** `km > max_kmh * hours` (so two far-apart sign-ins at the same
     second are flagged). Compare with the unrounded values.
   - Return a list of dicts `{"user", "from_city", "to_city", "from_time", "to_time", "km",
     "hours"}`: the times as written in the file, `km` rounded to a whole number (`int`) and
     `hours` rounded to 2 decimals. Order by `user`, then `from_time`.
3. **`web_probes(path)`** reads a web server log in Combined Log Format:
   `<ip> - - [<time>] "<method> <target> <protocol>" <status> <bytes> "<referer>" "<agent>"`.
   - Skip any line whose request (the text inside the first pair of quotes) is not exactly three
     words separated by single spaces, such as `"-"`.
   - Decode the target **twice** with `urllib.parse.unquote_plus` (attackers double-encode, so
     `%252f` becomes `%2f`, then `/`) and lower-case it.
   - The request is **`traversal`** if the decoded target contains `../` or `..\`. Otherwise it is
     **`injection`** if it contains any of `' or ` (quote, space, or, space), `union select`,
     `sleep(`, `<script` or `${jndi:`. Otherwise it is not a probe.
   - Return a list of dicts `{"time", "ip", "kind", "status", "target"}` in file order: `time` is
     the text inside the brackets, `status` an `int`, `target` exactly as logged (not decoded).
4. **`ioc_matches(processes_path, iocs_path)`** reads the EDR export (columns
   `host,time,user,pid,ppid,image,command_line,sha256`) and the IoC list (columns
   `type,value,source`, where `type` is `sha256`, `domain` or `ipv4`).
   - A process matches by **`sha256`** if its hash equals an IoC hash, ignoring case. Otherwise
     by **`domain`**, then by **`ipv4`**, if an IoC value of that type appears in its
     `command_line` as a whole token: ignoring case, and with no letter, digit, `.` or `-`
     immediately before or after it. So `10.1.1.1` matches `http://10.1.1.1:8080/` but not
     `10.1.1.10`, and `sync.example.org` does not match `filesync.example.org`.
   - Check the IoCs of each type in file order and report the first match only, so each process
     appears at most once. Return a list of dicts `{"host", "time", "image", "match",
     "indicator"}` in the order of the processes file: `match` is the IoC type and `indicator`
     the IoC value as written in the IoC file.
5. **`report(data_dir)`** runs the four functions on `auth.log`, `signins.csv`, `access.log`,
   `processes.csv` and `iocs.csv` in that folder (default parameters) and returns a list of
   lines, in this order:
   - one per SSH result: `SSH <kind>: <ip> (<failures> failures, <accounts> accounts)`, followed
     by `; accepted: <users joined by ", ">` when `accepted` is not empty;
   - one per impossible-travel pair:
     `Impossible travel: <user> <from_city> -> <to_city> (<km> km in <hours> h)`, with `hours`
     shown with exactly two decimals;
   - exactly one line: `Web probes: <n> (<t> traversal, <i> injection) from <k> IPs, <s> answered 200`,
     where `k` counts distinct source IPs and `s` the probes whose status is 200;
   - one per IoC match: `IoC <match>: <host> <image> (<indicator>)`.

Example, with the files in `data/`:

```python
ssh_attacks("data/auth.log")[1]
# {'ip': '203.0.113.77', 'kind': 'password-spraying', 'failures': 8, 'accounts': 7, 'accepted': ['h.dlamini']}
impossible_travel("data/signins.csv")[1]
# {'user': 's.moreau', 'from_city': 'London', 'to_city': 'Singapore', 'from_time': '2026-10-14T07:58:03Z',
#  'to_time': '2026-10-14T09:31:28Z', 'km': 10848, 'hours': 1.56}
web_probes("data/access.log")[2]
# {'time': '14/Oct/2026:07:22:18 +0000', 'ip': '198.51.100.61', 'kind': 'traversal', 'status': 200,
#  'target': '/download?file=..%252f..%252f..%252fetc%252fpasswd'}
print("\n".join(report("data")))
```

```text
SSH brute-force: 198.51.100.23 (16 failures, 2 accounts)
SSH password-spraying: 203.0.113.77 (8 failures, 7 accounts); accepted: h.dlamini
Impossible travel: h.dlamini Southampton -> Johannesburg (9049 km in 4.84 h)
Impossible travel: s.moreau London -> Singapore (10848 km in 1.56 h)
Web probes: 9 (4 traversal, 5 injection) from 3 IPs, 3 answered 200
IoC sha256: rcp-ws-14 C:\Users\s.moreau\AppData\Local\Temp\svchost.exe (d1421388e30984358e50cf78be90dc21382412e414e71188b55542d6197f3f0b)
IoC domain: rcp-ws-22 C:\Windows\System32\certutil.exe (cdn-update.example.net)
IoC ipv4: rcp-ws-22 C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe (203.0.113.77)
IoC domain: xray-ws-31 C:\Windows\System32\cmd.exe (sync.example.org)
IoC sha256: srv-booking /tmp/.X11-unix/.cache/kworkerd (b3bcdf55fa2ccd99e9ef8d4a0aa630afff573b1f665c402bcc395057fff7b014)
```

Read it as the security lead would: the sprayed SSH password for `h.dlamini` was used from
Johannesburg, and the spraying address also appears in a PowerShell download on Bea Osei's
reception workstation, so this is one intrusion, not five alerts.

**Tips.** Look at each file first and note the lines that must be ignored. Build the SSH counts
with a `dict` of `Counter`s. `csv.DictReader` handles the quoted command line in
`processes.csv`. A regular expression with `(?<!...)` and `(?!...)` expresses the whole-token
rule, and `re.escape` keeps the dots in a value literal.
