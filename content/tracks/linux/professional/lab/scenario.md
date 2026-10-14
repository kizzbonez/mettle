You have just joined the operations team of a small hosting company. Nobody has looked closely
at its servers for a year, and the first job your manager gives you is to find out how bad
things are.

You are not allowed to change anything on the servers yet, so a colleague ran a collection
script on each one as root. It runs six read-only commands and saves their output, one section
per command, in a single file per server:

```bash
for cmd in "df -hT" "systemctl --failed" "ss -tlnp" "cat /etc/ssh/sshd_config" \
           "getent passwd" "getent shadow"; do
  echo "### $cmd"
  $cmd
  echo
done > "$(hostname).txt"
```

Two bundles are waiting for you: `data/web01.txt`, a web server that has collected a few years
of quick fixes, and `data/db02.txt`, a database server that was rebuilt last month. On some
older machines the script failed half-way, so a bundle can be missing sections.

Fifty servers are waiting after these two, so the audit has to be a script. It must report the
same things the same way every time, so that next week's report can be compared with this one,
and it must exit with a non-zero status when it finds anything, so that the monitoring system can
run it too.
