cat > backup.service <<'EOF'
[Unit]
Description=Nightly backup of /etc and the databases

[Service]
Type=oneshot
User=backup
Restart=on-failure
ExecStartPre=/bin/mkdir -p /srv/backup > /dev/null
ExecStart=
ExecStart=/bin/sh -c 'tar czf /srv/backup/etc.tgz /etc | logger -t backup'
ExecStart=/usr/bin/bash -c "pg_dumpall > /srv/backup/all.sql"
ExecStart=sh -c 'echo done > /run/backup.ready'
ExecStart=/usr/bin/flock -n /run/backup.lock /usr/local/bin/backup && touch /run/backup.done
ExecStart=/usr/local/bin/backup-notify < /etc/backup/recipients
ExecStart=/usr/local/bin/sh-report -c /etc/report.conf | mail ops

[Install]
WantedBy=multi-user.target
EOF
actual=$(bash solution.sh backup.service)
status=$?
assert_eq "$actual" "shell syntax in ExecStart: /usr/bin/flock -n /run/backup.lock /usr/local/bin/backup && touch /run/backup.done
shell syntax in ExecStart: /usr/local/bin/backup-notify < /etc/backup/recipients
shell syntax in ExecStart: /usr/local/bin/sh-report -c /etc/report.conf | mail ops" \
  "several ExecStart lines, commands run by a shell, and settings other than ExecStart"
assert_eq "$status" "1" "exit status when only ExecStart has problems"
