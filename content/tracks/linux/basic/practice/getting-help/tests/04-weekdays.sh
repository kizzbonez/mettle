actual=$(bash solution.sh 2> errors4.txt)
days=$(printf '%s\n' "$actual" | sed -n '/^== Weekdays ==$/,${/^== /!p}')
assert_eq "$days" "Friday
Thursday" "the lines under '== Weekdays ==' (the weekdays of the two dates)"
assert_eq "$(cat errors4.txt)" "" "messages on standard error (a command complained)"

# The answers must come from type, help and date, not from echo.
grep -v '^[[:space:]]*#' solution.sh > code4.txt
grep -qw type code4.txt || fail "the script does not run type"
grep -qw help code4.txt || fail "the script does not run help"
grep -qw date code4.txt || fail "the script does not run date"
extra=$(grep -w echo code4.txt | grep -v '==')
assert_eq "$extra" "" "lines that use echo for something other than the three headings"
