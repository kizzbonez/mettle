# Comments, an empty line, an item whose name starts with END, an item exactly
# at its minimum, and lines after END.
{
  printf '# pantry for the winter\n'
  printf 'tea,1,3\n'
  printf '#coffee,0,9\n'
  printf '\n'
  printf 'endive,0,2\n'
  printf 'lentils,5,5\n'
  printf 'END\n'
  printf 'beans,0,10\n'
  printf '# a note after the end\n'
} > winter.csv

expected='buy tea: 5
buy endive: 4
total: 9'
actual=$(bash solution.sh winter.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "comments and empty lines skipped, items at their minimum not bought, and nothing read after END"

# END on the first line.
printf 'END\nrice,0,4\n' > closed.csv
actual=$(bash solution.sh closed.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'total: 0' "a list that starts with END"
