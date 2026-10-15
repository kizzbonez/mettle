expected='203.0.113.7 5
198.51.100.23 3'

actual=$(bash solution.sh data/auth.log) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "offenders in data/auth.log"
