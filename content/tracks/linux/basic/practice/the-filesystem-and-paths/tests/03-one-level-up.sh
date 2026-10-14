mkdir -p "store3/sets/act one" "store3/sets/act two" store3/sets/ladder store3/paint
touch store3/sets/backdrop.txt store3/sets/.plan "store3/sets/act one/chair.txt"

script="$PWD/solution.sh"
cd "store3/sets/act one" || fail "could not go into store3/sets/act one"
actual=$(bash "$script" 2> /dev/null)

up=$(printf '%s\n' "$actual" | sed -n '/^== one level up ==$/,/^== top ==$/{/^== /!p}')
assert_eq "$up" "act one/
act two/
backdrop.txt
ladder/" "the names under '== one level up ==', folders marked and hidden names left out"
