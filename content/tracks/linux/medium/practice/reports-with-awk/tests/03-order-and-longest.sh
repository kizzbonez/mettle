# Vans out of order, kilometres of different widths, and two records that
# share the longest trip.
{
  printf 'van,date,litres,km\n'
  printf 'van-9,2026-07-01,8.0,95\n'
  printf 'van-10,2026-07-01,99.5,1200\n'
  printf 'van-2,2026-07-02,60.0,1200\n'
  printf 'van-9,2026-07-03,1.5,30\n'
  printf 'van-2,2026-07-04,0.5,5\n'
} > july.csv

expected='van-10 99.5 1200
van-2 60.5 1205
van-9 9.5 125
fleet 169.5 2530
longest van-10 1200'

actual=$(bash solution.sh july.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "the order of the vans, and the longest single trip when two records share it"
