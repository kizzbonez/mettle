mkdir -p news4/old news4/templates
printf 'Issue 12\n\nThe summer fair raised 400 for the playground.\n' > news4/draft.txt
echo "Dear editor" > news4/letters.txt
: > news4/scratch.txt
echo "HEADER" > news4/templates/header.txt

script="$PWD/solution.sh"
cd news4 || fail "could not go into news4"
printed=$(bash "$script" 2>&1) || fail "solution.sh finished with a non-zero exit status"

assert_eq "$printed" "" "what the script printed (an empty scratch.txt)"
[ -e draft.txt ] && fail "draft.txt is still there (it should have been renamed)"
assert_eq "$(cat issue-12.txt 2> /dev/null)" "Issue 12

The summer fair raised 400 for the playground." "the contents of issue-12.txt"
[ -e scratch.txt ] && fail "scratch.txt is still there"
[ -e old ] && fail "the folder old is still there"
assert_eq "$(ls)" "archive
issue-12.txt
letters.txt
templates" "the names left at the top of the newsletter folder"
