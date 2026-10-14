# A file name with spaces, large numbers, and items that need nothing.
printf 'oats,40,250\nbutter,7,7\nyeast,0,0\nhoney,12,3\n' > 'pantry week 3.csv'
actual=$(bash solution.sh 'pantry week 3.csv') || fail "solution.sh exited with a non-zero status for a file name with spaces"
assert_eq "$actual" 'buy oats: 460
total: 460' "a file whose name contains spaces, with larger numbers and items that need nothing"

# Only comments, and an empty file.
printf '# nothing yet\n#\n' > comments.csv
actual=$(bash solution.sh comments.csv) || fail "solution.sh exited with a non-zero status for a file of comments"
assert_eq "$actual" 'total: 0' "a file that holds only comments"

: > empty.csv
actual=$(bash solution.sh empty.csv) || fail "solution.sh exited with a non-zero status for an empty file"
assert_eq "$actual" 'total: 0' "an empty file"
