# An empty file.
: > brief.txt
actual=$(bash solution.sh brief.txt draft) || fail "solution.sh exited with a non-zero status for an empty file"
assert_eq "$actual" "saved draft_brief.txt: 0 lines, 0 words" "the counts for an empty file"
[ -f draft_brief.txt ] || fail "the copy of an empty file was not created"

# No newline after the last line: wc -l counts newlines, wc -w counts words.
printf 'one two\nthree four five' > obituary.txt
actual=$(bash solution.sh obituary.txt final) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "saved final_obituary.txt: 1 lines, 5 words" "the counts for a file whose last line has no newline"
cmp -s final_obituary.txt obituary.txt || fail "the copy is not an exact copy of the file"
assert_eq "$(cat obituary.txt)" "$(printf 'one two\nthree four five')" "the original file after the copy"
