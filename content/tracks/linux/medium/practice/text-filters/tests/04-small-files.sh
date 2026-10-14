# A file name with spaces, two titles only, and no newline after the last line.
printf 'date,member,title\n2026-07-01,M5,Kindred\n2026-07-01,M6,Beloved\n2026-07-02,M5,KINDRED' > 'loans week 27.csv'

actual=$(bash solution.sh 'loans week 27.csv') || fail "solution.sh exited with a non-zero status for a file name with spaces"
assert_eq "$actual" '      2 kindred
      1 beloved' "a file whose name contains spaces, with fewer than three titles and no final newline"

# Only the header: nothing to print.
printf 'date,member,title\n' > header-only.csv
actual=$(bash solution.sh header-only.csv) || fail "solution.sh exited with a non-zero status for a file with only the header"
assert_eq "$actual" "" "a file that has only the header line"
