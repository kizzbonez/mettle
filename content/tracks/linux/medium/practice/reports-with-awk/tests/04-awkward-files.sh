# A file name with spaces, a van name with a space, and no newline after the last record.
printf 'van,date,litres,km\nBUS 1,2026-08-01,70.0,300\nBUS 1,2026-08-02,30.5,290' > 'fuel log august.csv'

expected='BUS 1 100.5 590
fleet 100.5 590
longest BUS 1 300'
actual=$(bash solution.sh 'fuel log august.csv') || fail "solution.sh exited with a non-zero status for a file name with spaces"
assert_eq "$actual" "$expected" "a file whose name contains spaces and whose last record has no newline"

# A single record.
printf 'van,date,litres,km\nE-CARGO,2026-08-03,0.5,12\n' > single.csv
expected='E-CARGO 0.5 12
fleet 0.5 12
longest E-CARGO 12'
actual=$(bash solution.sh single.csv) || fail "solution.sh exited with a non-zero status for a log with one record"
assert_eq "$actual" "$expected" "a log with a single record"
