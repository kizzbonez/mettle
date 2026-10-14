expected='readings: 3
logs: 2
notes: 3
errors: 3'

actual=$(bash solution.sh data release-week41) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "the summary printed for the upload in data/"

[ -f release-week41/SUMMARY.txt ] || fail "release-week41/SUMMARY.txt was not created"
assert_eq "$(cat release-week41/SUMMARY.txt)" "$expected" "the contents of release-week41/SUMMARY.txt"

[ -L release-week41/README.txt ] || fail "release-week41/README.txt is not a symbolic link"
assert_eq "$(head -n 1 release-week41/README.txt)" "Field Station 7, upload for week 41." \
  "the first line read through the release-week41/README.txt link"
