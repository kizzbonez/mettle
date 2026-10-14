actual=$(bash solution.sh 2> /dev/null)
line=$(printf '%s\n' "$actual" | grep -x -A 1 'Kernel:' | tail -n 1)
assert_eq "$line" "$(uname -s)" "the name printed on the line under 'Kernel:'"
