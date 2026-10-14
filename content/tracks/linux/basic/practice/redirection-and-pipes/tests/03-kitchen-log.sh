mkdir -p lunch3
printf 'toast\nporridge\n' > lunch3/orders.txt
printf 'oven on\nfridge at 4 C\ntally done\n' > lunch3/kitchen.log

script="$PWD/solution.sh"
cd lunch3 || fail "could not go into lunch3"
printed=$(bash "$script" 2> ../errors3.txt)

assert_eq "$(cat ../errors3.txt)" "" "what the script printed on standard error on a day without extras.txt"
assert_eq "$(cat kitchen.log)" "oven on
fridge at 4 C
tally done
tally done" "kitchen.log, which held three lines before the script ran"
assert_eq "$(cat first.txt 2> /dev/null)" "porridge
toast" "first.txt on a day with only two orders"
assert_eq "$printed" "2
porridge
toast" "what the script printed on a day with only two orders"
