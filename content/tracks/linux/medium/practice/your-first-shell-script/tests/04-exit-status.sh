# A file that does not exist: cp fails, and so must the script.
bash solution.sh no-such-story.txt v3 > /dev/null 2>&1
assert_eq "$?" "1" "exit status when FILE does not exist"
[ ! -e v3_no-such-story.txt ] || fail "a copy appeared although the file does not exist"

# A directory is not copied by plain cp either.
mkdir -p drafts
bash solution.sh drafts v3 > /dev/null 2>&1
assert_eq "$?" "1" "exit status when FILE is a directory"

# The file is fine but the copy cannot be written: a read-only file already
# has the copy's name. Only cp fails here; the commands after it succeed.
printf 'memo\n' > memo.txt
printf 'older memo\n' > locked_memo.txt
chmod 444 locked_memo.txt
bash solution.sh memo.txt locked > /dev/null 2>&1
assert_eq "$?" "1" "exit status when the copy cannot be written but the file itself can be read"

# And a good copy right after still succeeds.
printf 'short note\n' > note.txt
bash solution.sh note.txt v3 > /dev/null 2>&1
assert_eq "$?" "0" "exit status after a successful copy"
