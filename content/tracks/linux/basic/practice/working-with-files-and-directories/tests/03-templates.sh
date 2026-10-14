mkdir -p news3/old news3/templates/logos news3/archive/templates
echo "Issue 12" > news3/draft.txt
echo "Dear editor" > news3/letters.txt
echo "scrap" > news3/scratch.txt
echo "NEW HEADER" > news3/templates/header.txt
echo "NEW FOOTER" > news3/templates/footer.txt
echo "club logo" > news3/templates/logos/club.txt
echo "OLD HEADER" > news3/archive/templates/header.txt

script="$PWD/solution.sh"
cd news3 || fail "could not go into news3"
printed=$(bash "$script" 2>&1)

assert_eq "$printed" "" "what the script printed when archive/templates exists already"
assert_eq "$(find archive/templates -mindepth 1 | sort)" "archive/templates/footer.txt
archive/templates/header.txt
archive/templates/logos
archive/templates/logos/club.txt" "what archive/templates holds when last month's copy was there (nothing nested inside it)"
assert_eq "$(cat archive/templates/header.txt)" "NEW HEADER" "archive/templates/header.txt, which must be this month's"
assert_eq "$(cat archive/templates/logos/club.txt 2> /dev/null)" "club logo" "the file in the folder inside templates"
assert_eq "$(find templates -mindepth 1 | sort)" "templates/footer.txt
templates/header.txt
templates/logos
templates/logos/club.txt" "the original templates folder, which must stay as it was"
