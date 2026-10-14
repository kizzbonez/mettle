mkdir -p news2/old news2/templates news2/archive/2026
echo "Issue 12" > news2/draft.txt
printf 'Dear editor,\nthe park lights are out again.\n' > news2/letters.txt
echo "scrap" > news2/scratch.txt
echo "HEADER" > news2/templates/header.txt
echo "Issue 11 as printed" > news2/archive/2026/issue-11.txt

script="$PWD/solution.sh"
cd news2 || fail "could not go into news2"
printed=$(bash "$script" 2>&1)

assert_eq "$printed" "" "what the script printed when archive/2026 exists already"
assert_eq "$(ls archive/2026)" "issue-11.txt
letters.txt" "the files in archive/2026 when it held last month's issue"
assert_eq "$(cat archive/2026/letters.txt 2> /dev/null)" "Dear editor,
the park lights are out again." "the contents of the copy in archive/2026"
assert_eq "$(cat letters.txt 2> /dev/null)" "Dear editor,
the park lights are out again." "letters.txt, which must stay where it was"
assert_eq "$(cat archive/2026/issue-11.txt)" "Issue 11 as printed" "the file that was already in archive/2026"
