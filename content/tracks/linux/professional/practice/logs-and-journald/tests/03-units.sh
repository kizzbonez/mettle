assert_eq "$(bash solution.sh data/journal.json debug orders-api)" "2026-10-14T08:00:01Z orders-api[2210]: Listening on 127.0.0.1:8081
2026-10-14T08:03:40Z orders-api[2210]: slow query: 2.8 s for GET /orders?status=open
2026-10-14T08:04:05Z systemd[1]: orders-api.service: Main process exited, code=killed, status=9/KILL
2026-10-14T08:04:05Z systemd[1]: orders-api.service: Failed with result 'oom-kill'.
2026-10-14T08:04:10Z systemd[1]: orders-api.service: Scheduled restart job, restart counter is at 1.
2026-10-14T08:04:10Z orders-api[2287]: Listening on 127.0.0.1:8081
2026-10-14T08:06:31Z orders-api[2287]: payment gateway returned 502 for order 88131" \
  "every entry of one unit, but not of a unit whose name starts the same way"

assert_eq "$(bash solution.sh data/journal.json info orders-api-worker)" \
  "2026-10-14T08:03:12Z orders-worker[2231]: job 88123 failed: printer queue offline" \
  "a unit whose name contains another unit's name"

assert_eq "$(bash solution.sh data/journal.json warning ssh)" "-- No entries --" \
  "a unit that has entries, none of them serious enough"

cat > backup.json <<'EOF'
{"__REALTIME_TIMESTAMP":"1791945000000000","PRIORITY":"6","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"systemd","_PID":"1","_SYSTEMD_UNIT":"init.scope","UNIT":"backup-db.timer","MESSAGE":"backup-db.timer: Triggering backup-db.service."}
{"__REALTIME_TIMESTAMP":"1791945000400000","PRIORITY":"6","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"systemd","_PID":"1","_SYSTEMD_UNIT":"init.scope","UNIT":"backup-db.service","MESSAGE":"Starting Nightly database dump..."}
{"__REALTIME_TIMESTAMP":"1791945005000000","PRIORITY":"3","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"backup-db","_PID":"4120","_SYSTEMD_UNIT":"backup-db.service","MESSAGE":"pg_dump: error: connection to server failed"}
{"__REALTIME_TIMESTAMP":"1791945007000000","PRIORITY":"3","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"systemd","_PID":"1","_SYSTEMD_UNIT":"init.scope","UNIT":"backup-db.service","MESSAGE":"backup-db.service: Failed with result 'exit-code'."}
EOF
assert_eq "$(bash solution.sh backup.json info backup-db.timer)" \
  "2026-10-14T02:30:00Z systemd[1]: backup-db.timer: Triggering backup-db.service." \
  "a unit name that already has a type other than .service"
assert_eq "$(bash solution.sh backup.json err backup-db)" "2026-10-14T02:30:05Z backup-db[4120]: pg_dump: error: connection to server failed
2026-10-14T02:30:07Z systemd[1]: backup-db.service: Failed with result 'exit-code'." \
  "the unit's own entries and systemd's entries about it"
