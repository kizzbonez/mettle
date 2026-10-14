mkdir -p office2/staff office2/term-1 office2/term-2
echo "Tue 09:00 science" > office2/timetable-2026.txt
echo "Term 1" > office2/term-1/dates.txt
echo "Term 2" > office2/term-2/dates.txt

script="$PWD/solution.sh"
cd office2 || fail "could not go into office2"
bash "$script" > /dev/null 2>&1

[ -e timetable.txt ] || fail "timetable.txt was not created"
[ -L timetable.txt ] && fail "timetable.txt is a symbolic link, not a hard link"
[ timetable.txt -ef timetable-2026.txt ] || fail "timetable.txt and timetable-2026.txt are not the same file (a copy is not a link)"

echo "Fri 14:00 sport" >> timetable.txt
assert_eq "$(cat timetable-2026.txt)" "Tue 09:00 science
Fri 14:00 sport" "timetable-2026.txt after a line was added through timetable.txt"

rm timetable-2026.txt
assert_eq "$(cat timetable.txt 2> /dev/null)" "Tue 09:00 science
Fri 14:00 sport" "the timetable read through timetable.txt after timetable-2026.txt was deleted"
