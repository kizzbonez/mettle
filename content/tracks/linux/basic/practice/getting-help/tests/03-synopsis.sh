actual=$(bash solution.sh 2> /dev/null)
synopsis=$(printf '%s\n' "$actual" | sed -n '/^== pwd ==$/,/^== Weekdays ==$/{/^== /!p}')
assert_eq "$synopsis" "$(help -s pwd)" "the line under '== pwd ==' (only the short synopsis of pwd)"
