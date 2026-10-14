cat > edge.json <<'EOF'
{"__REALTIME_TIMESTAMP":"1791965099999999","PRIORITY":"4","SYSLOG_FACILITY":"3","SYSLOG_IDENTIFIER":"orders-api","_PID":"2287","_SYSTEMD_UNIT":"orders-api.service","MESSAGE":"config \"orders.yaml\" reloaded: 3 printers, 0 queues paused"}
{"__REALTIME_TIMESTAMP":"1791965100000001","PRIORITY":"4","SYSLOG_FACILITY":"0","SYSLOG_IDENTIFIER":"kernel","_TRANSPORT":"kernel","MESSAGE":"usb 1-1: device descriptor read/64, error -71"}
EOF
assert_eq "$(bash solution.sh edge.json warning)" "2026-10-14T08:04:59Z orders-api[2287]: config \"orders.yaml\" reloaded: 3 printers, 0 queues paused
2026-10-14T08:05:00Z kernel: usb 1-1: device descriptor read/64, error -71" \
  "times just before and after a whole second, quotes in a message, and an entry without _PID"

assert_eq "$(bash solution.sh edge.json warning nginx)" "-- No entries --" "a unit with no entries at all"

: > empty.json
assert_eq "$(bash solution.sh empty.json debug)" "-- No entries --" "an empty export"
