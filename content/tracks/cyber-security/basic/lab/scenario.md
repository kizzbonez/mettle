You are on call for a small hosting company. At 03:14 the monitoring system pages you:
`web01` is logging an unusual number of SSH authentication failures.

The firewall team can block addresses, but they need a list, and they need the same list every
time the report is run so they can compare one hour with the next. A copy of the server's
authentication log is waiting for you at `data/auth.log`.

```text
Oct 12 03:14:07 web01 sshd[2211]: Failed password for root from 203.0.113.7 port 51122 ssh2
Oct 12 03:14:09 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.7 port 51124 ssh2
Oct 12 03:15:01 web01 sshd[2301]: Accepted password for deploy from 198.51.100.4 port 40022 ssh2
```

Someone mistyping a password fails once or twice. A script does not stop at two.
