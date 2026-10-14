cp data/story.txt story.txt

actual=$(bash solution.sh story.txt v2)
status=$?
assert_eq "$actual" "saved v2_story.txt: 5 lines, 33 words" "the line printed for story.txt with the tag v2"
assert_eq "$status" "0" "exit status after a successful copy"

[ -f v2_story.txt ] || fail "the copy v2_story.txt was not created"
cmp -s v2_story.txt story.txt || fail "v2_story.txt is not an exact copy of story.txt"
