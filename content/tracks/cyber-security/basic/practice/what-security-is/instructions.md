The script is run as `bash solution.sh LOG`. It reads an authentication log, like the one in the
lesson, and prints one line for each **authentication** or **authorization** event, in log order.
The log itself is the **accounting** record.

The starter already handles the `sshd` lines (authentication). Your job is the `sudo` lines, in the
place marked `YOUR CODE`. The starter has already put the user name in `$user` and the text after
`COMMAND=` in `$command`.

1. A `sudo` line containing `incorrect password attempt` means sudo asked for the password again
   and it was wrong. Print `authentication failure USER`. Check this rule **first**: these lines
   also contain `COMMAND=`.
2. A `sudo` line containing `NOT in sudoers` or `command not allowed` means the person is known
   but the sudo policy refused. Print `authorization denied USER COMMAND`.
3. Any other `sudo` line containing `COMMAND=` was allowed. Print
   `authorization granted USER COMMAND`.
4. Every other `sudo` line (such as `pam_unix(sudo:session): session opened ...`) prints nothing.

`COMMAND` is the whole command, spaces and all. The script prints nothing else and exits with
status 0.

**Example.** `bash solution.sh data/auth.log` prints:

```text
authentication success maya
authorization granted maya /usr/bin/systemctl restart booking.service
authentication failure owen
authentication success owen
authorization denied owen /usr/bin/cat /etc/shadow
authentication failure admin
authentication failure maya
```

Owen proved who he was (line 4) but was still refused root (line 5): passing authentication does
not mean passing authorization.

**Tip.** The `sshd` part shows how to test a line: `[[ $line == *"Accepted "* ]]` is true when
`Accepted ` appears anywhere in the line. Use `if`, `elif` and `elif` so that only the first
matching rule prints.
