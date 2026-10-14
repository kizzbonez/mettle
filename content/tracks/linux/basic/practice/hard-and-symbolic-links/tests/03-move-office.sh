mkdir -p office3/staff office3/term-1 office3/term-2
echo "Wed 11:00 music" > office3/timetable-2026.txt
echo "Term 1" > office3/term-1/dates.txt
echo "Term 2, moved office" > office3/term-2/dates.txt
touch office3/staff/rota.txt

script="$PWD/solution.sh"
cd office3 || fail "could not go into office3"
bash "$script" > /dev/null 2>&1
cd .. || fail "could not leave office3"

[ -L office3/staff/timetable.txt ] || fail "staff/timetable.txt is not a symbolic link"
assert_eq "$(readlink office3/staff/timetable.txt)" "../timetable-2026.txt" "the target stored in staff/timetable.txt"

mv office3 "moved office 3"
assert_eq "$(cat "moved office 3/staff/timetable.txt" 2> /dev/null)" "Wed 11:00 music" "the timetable read through staff/timetable.txt after the office folder was moved"
assert_eq "$(cat "moved office 3/latest/dates.txt" 2> /dev/null)" "Term 2, moved office" "the dates read through latest after the office folder was moved"
