# A file name with spaces, and an ID on a last line that has no newline.
printf 'quiet day\nfollow up on WEB-4410' > 'stand up 14.txt'
actual=$(bash solution.sh 'stand up 14.txt') || fail "solution.sh exited with a non-zero status for a file name with spaces"
assert_eq "$actual" 'WEB-4410
lines without a ticket: 1' "a file whose name contains spaces, with an ID on a last line that has no newline"

# No IDs at all, and the last line has no newline.
printf 'all quiet\nstill quiet' > quiet.txt
actual=$(bash solution.sh quiet.txt) || fail "solution.sh exited with a non-zero status for a file without IDs"
assert_eq "$actual" 'lines without a ticket: 2' "a file without any ID whose last line has no newline"

# An empty file.
: > empty.txt
actual=$(bash solution.sh empty.txt) || fail "solution.sh exited with a non-zero status for an empty file"
assert_eq "$actual" 'lines without a ticket: 0' "an empty file"
