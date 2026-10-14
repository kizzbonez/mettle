expected='buy rice: 6
buy olive oil: 3
buy salt: 2
total: 11'

actual=$(bash solution.sh data/pantry.csv) || fail "solution.sh exited with a non-zero status for data/pantry.csv"
assert_eq "$actual" "$expected" "the shopping list for the sample file data/pantry.csv"
