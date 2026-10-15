actual=$(bash solution.sh data/schedule.csv data/records.csv data/holds.csv 2026-11-16)
status=$?
assert_eq "$actual" "DISPOSE INV-2019-0310 due 2025-05-20 secure-delete
KEEP INV-2021-0088 until 2027-02-11
HOLD CCTV-1009 LH-2026-03
HOLD CCTV-1102 LH-2026-03
HOLD STF-2018-0007 LH-2025-11
DISPOSE STF-2020-0031 due 2026-03-01 secure-delete
KEEP STF-2023-0012 open
DISPOSE ADM-2025-0410 due 2026-11-16 secure-delete
KEEP ADM-2025-0533 until 2026-11-17
DISPOSE PUP-2001-0142 due 2026-09-04 shred
REVIEW LIB-2022-0001 no-schedule
KEEP SAF-2019-0003 until 2045-01-15
SUMMARY 4 dispose, 3 hold, 4 keep, 1 review" "the disposal run for the files in data/ on 2026-11-16"
assert_eq "$status" "0" "exit status"
