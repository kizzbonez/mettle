# A backslash in a name, spaces at the start of a name, a name with a space,
# and a last line without a newline.
printf 'cups\\saucers,1,6\n  napkins,0,2\npaper towels,3,4' > kitchen.csv

expected='buy cups\saucers: 11
buy   napkins: 4
buy paper towels: 5
total: 20'
actual=$(bash solution.sh kitchen.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "names with a backslash, leading spaces and inner spaces, and a last line without a newline"
