cat > studio-b.cron <<'EOF'
# Studio B automation
#0 * * * * /usr/local/bin/disabled-job
   #0 3 * * * /usr/local/bin/old-backup
SHELL = /bin/bash
MAILTO=""
@hourly /usr/local/bin/hourly-shortcut

	0	*	*	*	*	/usr/local/bin/tab-separated --flag
0 3 * * *   tar czf /srv/backup/audio-$(date +\%F).tgz /srv/audio >> /var/log/audio-backup.log 2>&1
   15 3 * * 1-5 /usr/local/bin/indented-job   --quiet
EOF

assert_eq "$(bash solution.sh studio-b.cron "2026-10-14 03:00")" "/usr/local/bin/tab-separated --flag
tar czf /srv/backup/audio-\$(date +\\%F).tgz /srv/audio >> /var/log/audio-backup.log 2>&1" \
  "commented-out jobs, variable lines, @ lines, tabs, and a command with special characters"
assert_eq "$(bash solution.sh studio-b.cron "2026-10-14 03:15")" "/usr/local/bin/indented-job   --quiet" \
  "an indented job line, and the command kept as it is written"
assert_eq "$(bash solution.sh studio-b.cron "2026-10-14 03:01")" "" "a minute at which no job runs"
