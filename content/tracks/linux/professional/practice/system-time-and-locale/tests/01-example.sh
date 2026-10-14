actual=$(bash solution.sh data/events.txt)
assert_eq "$actual" '2026-10-14T09:00:02Z pay-nyc chronyd: Selected source 192.0.2.123 (pool.ntp.org)
2026-10-14T09:01:40Z pay-nyc gateway: certificate verify failed (not yet valid)
2026-10-14T09:01:58Z db-lon postgres: replication slot "pay_ro" lag 41 s
2026-10-14T09:02:11Z web-mnl checkout: 502 from payment gateway
2026-10-14T09:02:11Z web-mnl checkout: retry 1 for order 88131
2026-10-14T09:02:11Z db-lon postgres: connection from 10.20.0.15 refused' \
  "the UTC timeline of data/events.txt"
