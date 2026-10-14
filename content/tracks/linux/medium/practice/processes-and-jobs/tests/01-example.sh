expected='ok: 2
failed: 1
worst: 3'

actual=$(bash solution.sh data/backup.sh data/report.sh data/cleanup.sh 2> /dev/null)
status=$?
assert_eq "$actual" "$expected" "the summary for the three sample jobs"
assert_eq "$status" "1" "exit status when one of the jobs failed"
