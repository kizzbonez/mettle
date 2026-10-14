expected='apollo 22.5
borealis 14.0
cygnus 6.0
total 42.5
rejected 2'

actual=$(bash solution.sh data) || fail "solution.sh exited with a non-zero status for the sample folder"
assert_eq "$actual" "$expected" "report for the sample folder data/"
