# This test makes the newsletter folder from the instructions, news1.
mkdir -p news1/old news1/templates
echo "Issue 12: the new bus shelter" > news1/draft.txt
echo "Dear editor, thank you for the bench." > news1/letters.txt
echo "call the printer" > news1/scratch.txt
echo "THE ELM STREET NEWS" > news1/templates/header.txt
echo "Printed by volunteers" > news1/templates/footer.txt

# Then it goes into news1, runs your script there, and shows you what the
# folder holds afterwards.
script="$PWD/solution.sh"
cd news1 || fail "could not go into news1"
printed=$(bash "$script" 2>&1)
holds=$(find . -mindepth 1 | sort | sed 's|^\./||')

echo "Your script printed:"
echo "$printed"
echo
echo "news1 now holds:"
echo "$holds"
echo

assert_eq "$printed" "" "what the script printed, errors included (it should print nothing)"
expected='archive
archive/2026
archive/2026/letters.txt
archive/templates
archive/templates/footer.txt
archive/templates/header.txt
issue-12.txt
letters.txt
templates
templates/footer.txt
templates/header.txt'
assert_eq "$holds" "$expected" "the files and folders in news1 after the script"
