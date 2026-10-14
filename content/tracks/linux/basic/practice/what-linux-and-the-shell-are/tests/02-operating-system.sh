actual=$(bash solution.sh 2> /dev/null)
line=$(printf '%s\n' "$actual" | grep -x -A 1 'Operating system:' | tail -n 1)
assert_eq "$line" "$(uname -o)" "the name printed on the line under 'Operating system:'"
