# This test builds the prop store from the instructions in the folder props1.
mkdir -p props1/costumes/hats props1/lights props1/scenery
touch props1/stock-list.txt props1/costumes/capes.txt
touch props1/costumes/hats/.label props1/costumes/hats/bowler.txt props1/costumes/hats/crown.txt

# Then it goes into props1/costumes/hats, runs your script from there and
# shows you what it printed.
script="$PWD/solution.sh"
top="$PWD/props1"
cd props1/costumes/hats || fail "could not go into props1/costumes/hats"
actual=$(bash "$script")

echo "Your script printed:"
echo "$actual"
echo

expected="== here ==
.label
bowler.txt
crown.txt
== one level up ==
capes.txt
hats/
== top ==
$top
costumes/
lights/
scenery/
stock-list.txt"
assert_eq "$actual" "$expected" "the tour printed from props1/costumes/hats"
