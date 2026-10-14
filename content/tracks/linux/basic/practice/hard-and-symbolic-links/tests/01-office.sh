# This test makes an office folder, office1, without a latest link.
mkdir -p office1/staff office1/term-1 office1/term-2
echo "Mon 09:00 maths, Mon 10:00 reading" > office1/timetable-2026.txt
echo "Term 1: 1 September to 18 December" > office1/term-1/dates.txt
echo "Term 2: 5 January to 26 March" > office1/term-2/dates.txt

# Then it goes into office1, runs your script there, and shows you what it
# printed and the long listing of office1 and office1/staff.
script="$PWD/solution.sh"
cd office1 || fail "could not go into office1"
printed=$(bash "$script" 2>&1)

echo "Your script printed:"
echo "$printed"
echo
ls -l . staff
echo

assert_eq "$printed" "../timetable-2026.txt
term-2" "what the script printed"
[ -L timetable.txt ] && fail "timetable.txt is a symbolic link, not a hard link"
[ timetable.txt -ef timetable-2026.txt ] || fail "timetable.txt is not a second name for timetable-2026.txt"
assert_eq "$(cat staff/timetable.txt 2> /dev/null)" "Mon 09:00 maths, Mon 10:00 reading" "the timetable read through staff/timetable.txt"
assert_eq "$(cat latest/dates.txt 2> /dev/null)" "Term 2: 5 January to 26 March" "the dates read through latest/dates.txt"
