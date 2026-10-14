actual=$(bash solution.sh data/journal.json warning orders-api)
assert_eq "$actual" "2026-10-14T08:03:40Z orders-api[2210]: slow query: 2.8 s for GET /orders?status=open
2026-10-14T08:04:05Z systemd[1]: orders-api.service: Failed with result 'oom-kill'.
2026-10-14T08:06:31Z orders-api[2287]: payment gateway returned 502 for order 88131" \
  "warning and worse for the unit orders-api in data/journal.json"
