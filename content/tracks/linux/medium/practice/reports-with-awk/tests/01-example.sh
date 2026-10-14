expected='VAN-1 80.5 1000
VAN-2 78.5 915
VAN-3 12.5 140
fleet 171.5 2055
longest VAN-1 520'

actual=$(bash solution.sh data/fuel.csv) || fail "solution.sh exited with a non-zero status for data/fuel.csv"
assert_eq "$actual" "$expected" "the report for the sample file data/fuel.csv"
