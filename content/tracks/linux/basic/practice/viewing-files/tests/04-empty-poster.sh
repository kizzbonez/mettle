mkdir -p pool4
cp data/bookings.log pool4/
: > pool4/poster.png

script="$PWD/solution.sh"
cd pool4 || fail "could not go into pool4"
actual=$(bash "$script" 2> ../errors4.txt)

poster=$(printf '%s\n' "$actual" | sed -n '/^== poster ==$/,${/^== /!p}')
assert_eq "$poster" "poster.png: empty" "the line under '== poster ==' when poster.png is an empty file"
assert_eq "$(cat ../errors4.txt)" "" "messages on standard error (a command complained)"
