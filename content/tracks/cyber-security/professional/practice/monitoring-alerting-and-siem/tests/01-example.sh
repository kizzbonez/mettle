actual=$(bash solution.sh data/auth.log 4 10 data/canaries.txt)
status=$?
assert_eq "$actual" "CANARY svc-backup-old from 203.0.113.45 at 2026-10-14T02:09:02.448Z
SPRAY 203.0.113.45 at 2026-10-14T02:09:02.448Z
CANARY admin-legacy from 10.44.3.9 at 2026-10-14T03:02:09.117Z" \
  "alerts for data/auth.log with threshold 4, 10 minutes and data/canaries.txt"
assert_eq "$status" "1" "exit status when there are alerts"
