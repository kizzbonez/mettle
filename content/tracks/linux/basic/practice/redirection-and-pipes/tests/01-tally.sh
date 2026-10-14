# This test makes the lunch folder from the instructions, lunch1, without
# extras.txt.
mkdir -p lunch1
printf 'soup\nsalad\nnoodles\nchili\nsoup\nrisotto\n' > lunch1/orders.txt
echo "oven on at 11:00" > lunch1/kitchen.log

# Then it goes into lunch1, runs your script there, and shows you what went
# to standard output, what went to standard error, and the files afterwards.
script="$PWD/solution.sh"
cd lunch1 || fail "could not go into lunch1"
printed=$(bash "$script" 2> ../errors1.txt)

echo "Your script printed:"
echo "$printed"
echo
echo "On standard error:"
cat ../errors1.txt
echo
for file in sorted.txt first.txt kitchen.log; do
  echo "$file holds:"
  cat "$file" 2>&1
  echo
done

assert_eq "$printed" "6
chili
noodles
risotto" "what the script printed on standard output"
assert_eq "$(cat ../errors1.txt)" "" "what the script printed on standard error"
assert_eq "$(cat sorted.txt 2> /dev/null)" "chili
noodles
risotto
salad
soup
soup" "the contents of sorted.txt"
assert_eq "$(cat first.txt 2> /dev/null)" "chili
noodles
risotto" "the contents of first.txt"
assert_eq "$(cat kitchen.log)" "oven on at 11:00
tally done" "the contents of kitchen.log"
