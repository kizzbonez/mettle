mkdir -p lunch4
: > lunch4/orders.txt
: > lunch4/kitchen.log
printf '2 high chairs\nbirthday candles\n' > lunch4/extras.txt

script="$PWD/solution.sh"
cd lunch4 || fail "could not go into lunch4"
printed=$(bash "$script" 2> ../errors4.txt)

assert_eq "$printed" "0
2 high chairs
birthday candles" "what the script printed on a day with no orders but with extras"
assert_eq "$(cat ../errors4.txt)" "" "what the script printed on standard error"
[ -f sorted.txt ] || fail "sorted.txt was not created on a day with no orders"
[ -f first.txt ] || fail "first.txt was not created on a day with no orders"
assert_eq "$(cat sorted.txt first.txt)" "" "sorted.txt and first.txt on a day with no orders"
assert_eq "$(cat kitchen.log)" "tally done" "kitchen.log when it started empty"
