Complete `solution.sh`. It is called with two arguments:

```bash
bash solution.sh BUNDLE ALLOWED_PORTS
```

`BUNDLE` is the path of a bundle file. `ALLOWED_PORTS` is a comma-separated list of TCP ports
that may listen on the network, such as `22,80,443`; it can be empty (`""`).

The starter already finds each section, prints `skip: <command> not collected` in place of a
missing one, and counts the findings. You write `section`, the six checks and the last lines.

1. **`section NAME`** prints the lines of the section whose header is exactly `### NAME`,
   without the header, up to the next line that starts with `### ` or the end of the file.
   Every section ends with an empty line; ignore empty lines in every check.
2. **Disks** (`df -hT`). Skip the header line and the filesystem types `tmpfs`, `devtmpfs` and
   `squashfs` (memory filesystems and read-only snap images are full by design). For every other
   filesystem whose `Use%` is **90 or more**, print `disk: <mount point> at <N>%`.
3. **Units** (`systemctl --failed`). Each failed unit's line starts with the marker `●`, followed
   by the columns UNIT, LOAD, ACTIVE, SUB and DESCRIPTION. Print `unit: <unit> (<description>)`,
   with the words of the description separated by single spaces.
4. **Ports** (`ss -tlnp`). For each `LISTEN` line, the fourth column is `address:port`; the port
   is what follows the **last** colon (IPv6 addresses contain colons). Ignore loopback addresses
   (those starting with `127.`, and `[::1]`) and ports that are in `ALLOWED_PORTS` (whole
   numbers only: allowing `80` does not allow `8080`). Print
   `port: <port> on <address> by <process>`, where the process is the first name inside
   `users:(("...`, or `?` when the line has no process column.
5. **SSH** (`cat /etc/ssh/sshd_config`). Read the file the way sshd does:
   - skip empty lines and comments (lines whose first non-blank character is `#`), and ignore
     leading spaces and tabs;
   - the keyword is the first word and is **case-insensitive**; the value is the second word;
   - when a keyword appears more than once, the **first** value counts;
   - the global settings end at the first `Match` line; ignore it and everything after it;
   - ignore `Include` lines (the included files were not collected);
   - a keyword that is not set has its default: `PermitRootLogin` is `prohibit-password`,
     `PasswordAuthentication` is `yes`.

   The policy is that both must be exactly `no`. Print
   `sshd: PermitRootLogin is <value> (want no)` and then
   `sshd: PasswordAuthentication is <value> (want no)`, each only when it breaks the policy.
6. **Root accounts** (`getent passwd`). Print `account: <name> has UID 0` for every account
   other than `root` whose UID, the third field, is `0`.
7. **Empty passwords** (`getent shadow`). Print `account: <name> has an empty password` for
   every account whose password, the second field, is empty. `!`, `*` and `!*` mean locked, not
   empty.
8. **Summary.** After the checks, print `findings: N` with the number of finding lines (skip
   lines are not findings). Exit with status `1` if `N` is greater than 0, otherwise `0`.

Findings appear in the order of the checks above, and within a check in the order of the lines
in the bundle.

Example, for `bash solution.sh data/web01.txt 22,80,443` (exit status 1):

```text
disk: /var at 94%
disk: /home at 90%
unit: backup-db.service (Nightly database dump)
unit: certbot.service (Certbot)
port: 6379 on 0.0.0.0 by redis-server
port: 9100 on * by node_exporter
sshd: PermitRootLogin is yes (want no)
sshd: PasswordAuthentication is yes (want no)
account: toor has UID 0
account: guest has an empty password
findings: 10
```

`bash solution.sh data/db02.txt 22,5432` prints only `findings: 0` and exits with status 0.

**Tools available:** `bash`, `awk`, `grep`, `sed`, `sort`, `cut`, `tr`, `wc`.

**Tips**

- One `awk` program per check is usually enough. `awk -F:` splits the account files.
- In `awk`, `match(s, /:[^:]*$/)` finds the last colon of `s`, and `tolower()` helps with
  keywords.
- While you work on one check, comment out the other `run_check` lines so that its output is
  all you see.
