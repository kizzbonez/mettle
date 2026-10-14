# Lines that are not records (too few or too many fields, empty, notes),
# and totals that are whole numbers of litres.
{
  printf 'van,date,litres,km\n'
  printf 'TRUCK-7,2026-06-01,40,300\n'
  printf '\n'
  printf 'TRUCK-7,2026-06-02,55,610\n'
  printf 'TRUCK-7,2026-06-03,20\n'
  printf 'fuel card lost, reported to the bank\n'
  printf 'TRUCK-8,2026-06-03,5,4\n'
  printf 'TRUCK-7,2026-06-04,10,100,receipt missing\n'
} > june.csv

expected='TRUCK-7 95.0 910
TRUCK-8 5.0 4
fleet 100.0 914
longest TRUCK-7 610'

actual=$(bash solution.sh june.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "which lines are records, and litres printed with one decimal place"
