# A file name and a tag that both contain spaces.
printf 'Item one\nItem two: budget\n' > 'council meeting.txt'

actual=$(bash solution.sh 'council meeting.txt' 'after legal')
status=$?
assert_eq "$actual" "saved after legal_council meeting.txt: 2 lines, 5 words" \
  "the line printed when the file name and the tag contain spaces"
assert_eq "$status" "0" "exit status after a successful copy of a file whose name contains spaces"

[ -f 'after legal_council meeting.txt' ] || fail "the copy was not created under the expected name when the names contain spaces"
cmp -s 'after legal_council meeting.txt' 'council meeting.txt' || fail "the copy is not an exact copy of the file"
