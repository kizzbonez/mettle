cat > t2-schedule.csv <<'EOF'
category,retain,trigger,disposal

visitor-log,90d,created,overwrite
contract,7y,closed,shred
exam-script,1y,created,secure-delete
EOF
cat > t2-records.csv <<'EOF'
record_id,category,created,closed
VIS-1,visitor-log,2027-01-01,
VIS-2,visitor-log,2026-12-31,2027-01-02

VIS-3,visitor-log,2027-01-02,
CON-1,contract,2015-03-01,2020-03-31
CON-2,contract,2015-03-01,2020-04-01
CON-3,contract,2019-06-01,
CON-4,contract,2012-02-29,2020-02-29
EXM-1,exam-script,2026-03-31,2026-03-31
EXM-2,exam-script,2026-04-01,
EXM-3,exam-script,2024-02-29,2024-07-01
EOF
printf 'hold_id,applies_to,issued,released\n' > t2-holds.csv
actual=$(bash solution.sh t2-schedule.csv t2-records.csv t2-holds.csv 2027-03-31)
assert_eq "$actual" "KEEP VIS-1 until 2027-04-01
DISPOSE VIS-2 due 2027-03-31 overwrite
KEEP VIS-3 until 2027-04-02
DISPOSE CON-1 due 2027-03-31 shred
KEEP CON-2 until 2027-04-01
KEEP CON-3 open
DISPOSE CON-4 due 2027-03-01 shred
DISPOSE EXM-1 due 2027-03-31 secure-delete
KEEP EXM-2 until 2027-04-01
DISPOSE EXM-3 due 2025-03-01 secure-delete
SUMMARY 5 dispose, 0 hold, 5 keep, 0 review" \
  "days and years, the created and closed triggers, the due date itself, an open matter and 29 February"
