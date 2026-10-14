assert_eq "$(bash solution.sh data/journal.json err)" "2026-10-14T08:03:12Z orders-worker[2231]: job 88123 failed: printer queue offline
2026-10-14T08:04:05Z kernel: Out of memory: Killed process 2210 (orders-api) total-vm:3145728kB, anon-rss:2097152kB
2026-10-14T08:06:31Z orders-api[2287]: payment gateway returned 502 for order 88131" \
  "err and worse from every unit, including a kernel entry"

assert_eq "$(bash solution.sh data/journal.json 3 orders-api.service)" \
  "2026-10-14T08:06:31Z orders-api[2287]: payment gateway returned 502 for order 88131" \
  "a priority given as a number"

assert_eq "$(bash solution.sh data/journal.json 0)" "-- No entries --" "a priority no entry reaches"

cat > storage.json <<'EOF'
{"__REALTIME_TIMESTAMP":"1791968400000000","PRIORITY":"2","SYSLOG_FACILITY":"0","SYSLOG_IDENTIFIER":"kernel","_TRANSPORT":"kernel","MESSAGE":"EXT4-fs error (device dm-2): ext4_find_entry:1683: inode #131073: comm nginx: reading directory lblock 0"}
{"__REALTIME_TIMESTAMP":"1791968401250000","PRIORITY":"7","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"orders-api","_PID":"2287","_SYSTEMD_UNIT":"orders-api.service","MESSAGE":"cache hit ratio 0.93"}
{"__REALTIME_TIMESTAMP":"1791968402000000","PRIORITY":"5","SYSLOG_FACILITY":"10","SYSLOG_IDENTIFIER":"sudo","_PID":"2390","_SYSTEMD_UNIT":"session-4.scope","MESSAGE":"ana : TTY=pts/0 ; PWD=/home/ana ; USER=root ; COMMAND=/usr/bin/systemctl restart orders-api"}
{"__REALTIME_TIMESTAMP":"1791968403000000","PRIORITY":"2","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"smartd","_PID":"640","_SYSTEMD_UNIT":"smartmontools.service","MESSAGE":"Device: /dev/sda [SAT], FAILED SMART self-check. BACK UP DATA NOW!"}
{"__REALTIME_TIMESTAMP":"1791968404000000","PRIORITY":"6","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"systemd","_PID":"1","_SYSTEMD_UNIT":"init.scope","UNIT":"orders-api.service","MESSAGE":"Started Order API."}
EOF
assert_eq "$(bash solution.sh storage.json crit)" "2026-10-14T09:00:00Z kernel: EXT4-fs error (device dm-2): ext4_find_entry:1683: inode #131073: comm nginx: reading directory lblock 0
2026-10-14T09:00:03Z smartd[640]: Device: /dev/sda [SAT], FAILED SMART self-check. BACK UP DATA NOW!" \
  "the priority name crit"
assert_eq "$(bash solution.sh storage.json notice)" "2026-10-14T09:00:00Z kernel: EXT4-fs error (device dm-2): ext4_find_entry:1683: inode #131073: comm nginx: reading directory lblock 0
2026-10-14T09:00:02Z sudo[2390]: ana : TTY=pts/0 ; PWD=/home/ana ; USER=root ; COMMAND=/usr/bin/systemctl restart orders-api
2026-10-14T09:00:03Z smartd[640]: Device: /dev/sda [SAT], FAILED SMART self-check. BACK UP DATA NOW!" \
  "the priority name notice keeps every more serious entry, in file order"
