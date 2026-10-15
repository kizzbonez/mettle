cat > t4-schedule.csv <<'EOF'
category,retain,trigger,disposal
payroll,6y,created,secure-delete
EOF
cat > t4-records.csv <<'EOF'
record_id,category,created,closed
PAY-1,payroll,2019-04-05,
PAY-2,Payroll,2019-04-05,
OLD-1,payroll-archive,2001-01-01,
EOF
cat > t4-holds.csv <<'EOF'
hold_id,applies_to,issued,released
H-ARCHIVE,category:payroll-archive,2020-01-01,
EOF
actual=$(bash solution.sh t4-schedule.csv t4-records.csv t4-holds.csv 2026-12-01)
status=$?
assert_eq "$actual" "DISPOSE PAY-1 due 2025-04-05 secure-delete
REVIEW PAY-2 no-schedule
REVIEW OLD-1 no-schedule
SUMMARY 1 dispose, 0 hold, 0 keep, 2 review" \
  "categories missing from the schedule (compared exactly) go to review before any hold"
assert_eq "$status" "0" "exit status"

printf 'record_id,category,created,closed\n\n' > t4-none.csv
actual=$(bash solution.sh data/schedule.csv t4-none.csv data/holds.csv 2026-11-16)
assert_eq "$actual" "SUMMARY 0 dispose, 0 hold, 0 keep, 0 review" "a records file with only the header and a blank line"

actual=$(bash solution.sh data/schedule.csv data/records.csv data/holds.csv 2025-10-01)
assert_eq "$(printf '%s\n' "$actual" | grep -E '^[A-Z]+ (INV-2019-0310|STF-2018-0007) ')" "HOLD INV-2019-0310 LH-2024-02
DISPOSE STF-2018-0007 due 2025-07-31 secure-delete" \
  "the sample files on 2025-10-01, when one hold was not yet released and another not yet issued"
