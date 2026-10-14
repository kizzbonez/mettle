mkdir -p pool3
printf 'time,lane,swimmer\n06:00,4,Rafael Ortiz\n' > pool3/bookings.log
cp data/poster.png pool3/

script="$PWD/solution.sh"
cd pool3 || fail "could not go into pool3"
actual=$(bash "$script" 2> /dev/null)

latest=$(printf '%s\n' "$actual" | sed -n '/^== latest ==$/,/^== count ==$/{/^== /!p}')
assert_eq "$latest" "time,lane,swimmer
06:00,4,Rafael Ortiz" "the lines under '== latest ==' for a log with a single booking"
count=$(printf '%s\n' "$actual" | sed -n '/^== count ==$/,/^== poster ==$/{/^== /!p}')
assert_eq "$count" "2 bookings.log" "the line under '== count ==' for a log with a single booking"
