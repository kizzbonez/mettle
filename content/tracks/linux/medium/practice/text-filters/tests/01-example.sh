expected='      3 dune
      3 the hobbit
      2 emma'

actual=$(bash solution.sh data/loans.csv) || fail "solution.sh exited with a non-zero status for data/loans.csv"
assert_eq "$actual" "$expected" "the top three for the sample file data/loans.csv"
