mkdir -p ro3 d3
chmod 555 ro3
export TMPDIR=$PWD/ro3
printf 'alpha\n' > d3/list.txt
chmod 600 d3/list.txt
# A second name for the original file: it keeps the old content only if LIST is
# replaced by a new file instead of being changed in place.
ln d3/list.txt old-list.txt

out=$(bash solution.sh d3/list.txt beta gamma 2> err3.txt)
assert_eq "$?" "0" "exit status when adding two entries"
assert_eq "$out" "added beta
added gamma
2 added" "the output when adding two entries"
assert_eq "$(cat d3/list.txt)" "alpha
beta
gamma" "the allowlist after adding two entries"
assert_eq "$(cat old-list.txt)" "alpha" "LIST is replaced by a new file with mv, not changed in place"
assert_eq "$(stat -c %a d3/list.txt)" "644" "the permissions of the new allowlist"
assert_eq "$(ls -A d3)" "list.txt
list.txt.lock" "no temporary file is left after adding entries"

inode=$(stat -c %i d3/list.txt)
out=$(bash solution.sh d3/list.txt gamma alpha beta 2> err3.txt)
assert_eq "$?" "0" "exit status of a second run with nothing new"
assert_eq "$out" "0 added" "the output of a second run with nothing new"
assert_eq "$(stat -c %i d3/list.txt)" "$inode" "LIST is not replaced when nothing was added"
assert_eq "$(cat d3/list.txt)" "alpha
beta
gamma" "the allowlist after a second run with nothing new"
assert_eq "$(ls -A d3)" "list.txt
list.txt.lock" "no temporary file is left when nothing was added"
