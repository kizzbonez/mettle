mkdir -p office4/staff office4/term-1 office4/term-2
echo "Thu 13:00 art" > office4/timetable-2026.txt
echo "Term 1 dates" > office4/term-1/dates.txt
echo "Term 2 dates" > office4/term-2/dates.txt
ln -s term-1 office4/latest

script="$PWD/solution.sh"
cd office4 || fail "could not go into office4"
printed=$(bash "$script" 2> ../errors4.txt) || fail "solution.sh finished with a non-zero exit status"

assert_eq "$(cat ../errors4.txt)" "" "messages on standard error when latest existed already"
[ -L latest ] || fail "latest is not a symbolic link"
assert_eq "$(readlink latest)" "term-2" "the target stored in latest when it pointed to term-1 before"
assert_eq "$(ls -A term-1)" "dates.txt" "what term-1 holds (nothing may be added inside the old target)"
assert_eq "$(cat latest/dates.txt 2> /dev/null)" "Term 2 dates" "the dates read through latest"
assert_eq "$printed" "../timetable-2026.txt
term-2" "what the script printed when latest existed already"
