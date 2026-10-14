# This test runs your script, shows you what it printed, and compares that
# with the cheat sheet from the instructions.
actual=$(bash solution.sh)

echo "Your script printed:"
echo "$actual"
echo

expected='== Kinds ==
builtin
file
keyword
== pwd ==
pwd: pwd [-LP]
== Weekdays ==
Friday
Thursday'
assert_eq "$actual" "$expected" "the whole cheat sheet"
