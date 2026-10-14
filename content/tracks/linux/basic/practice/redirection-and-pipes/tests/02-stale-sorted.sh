mkdir -p lunch2
printf 'pasta\ncurry\nsoup\nbagel\ncurry\ntacos\nsalad\npho\nwrap\n' > lunch2/orders.txt
printf 'yesterday\n%.0s' 1 2 3 4 5 6 7 8 9 10 11 12 > lunch2/sorted.txt
echo "oven on" > lunch2/kitchen.log

script="$PWD/solution.sh"
cd lunch2 || fail "could not go into lunch2"
printed=$(bash "$script" 2> /dev/null)

assert_eq "$(printf '%s\n' "$printed" | head -n 1)" "9" "the first line printed: the number of orders on its own"
assert_eq "$(cat sorted.txt)" "bagel
curry
curry
pasta
pho
salad
soup
tacos
wrap" "the contents of sorted.txt when yesterday's sorted.txt was still there"
assert_eq "$(cat orders.txt)" "pasta
curry
soup
bagel
curry
tacos
salad
pho
wrap" "orders.txt, which must stay as it was"
