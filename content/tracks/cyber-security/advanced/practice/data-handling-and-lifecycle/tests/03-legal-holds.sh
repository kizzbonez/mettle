cat > t3-schedule.csv <<'EOF'
category,retain,trigger,disposal
email,2y,created,purge
cctv,30d,created,overwrite
EOF
cat > t3-records.csv <<'EOF'
record_id,category,created,closed
MAIL-1,email,2020-01-10,
MAIL-2,email,2020-01-11,
MAIL-3,email,2020-01-12,
MAIL-4,email,2020-01-13,
MAIL-5,email,2026-06-01,
MAIL-6,email,2020-01-14,
CAM-1,cctv,2025-01-01,
CAM-10,cctv,2025-01-01,
EOF
cat > t3-holds.csv <<'EOF'
hold_id,applies_to,issued,released
H-RELEASED-BEFORE,MAIL-1,2023-01-01,2026-12-31
H-RELEASED-TODAY,MAIL-2,2023-01-01,2027-01-15
H-RELEASED-LATER,MAIL-3,2023-01-01,2027-01-16
H-FUTURE,MAIL-4,2027-01-16,
H-TODAY,MAIL-6,2027-01-15,
H-NOT-YET-DUE,MAIL-5,2026-12-01,
H-OTHER-CATEGORY,category:email-archive,2020-01-01,
H-FIRST,CAM-1,2026-02-01,
H-SECOND,category:cctv,2026-01-01,
EOF
actual=$(bash solution.sh t3-schedule.csv t3-records.csv t3-holds.csv 2027-01-15)
assert_eq "$actual" "DISPOSE MAIL-1 due 2022-01-10 purge
DISPOSE MAIL-2 due 2022-01-11 purge
HOLD MAIL-3 H-RELEASED-LATER
DISPOSE MAIL-4 due 2022-01-13 purge
HOLD MAIL-5 H-NOT-YET-DUE
HOLD MAIL-6 H-TODAY
HOLD CAM-1 H-FIRST
HOLD CAM-10 H-SECOND
SUMMARY 3 dispose, 5 hold, 0 keep, 0 review" \
  "holds active by issue and release dates, by record ID or category, the first in file order, and before the schedule"
