actual=$(bash solution.sh 2> /dev/null)
kinds=$(printf '%s\n' "$actual" | sed -n '/^== Kinds ==$/,/^== pwd ==$/{/^== /!p}')
assert_eq "$kinds" "$(type -t cd date if)" "the lines under '== Kinds ==' (the kind of cd, date and if, one word each)"
