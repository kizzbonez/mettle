# This test makes the two check programs in the folder checks1: both finish
# with exit status 0, so the oven is hot and the till holds enough change.
mkdir -p checks1
printf '#!/bin/sh\nexit 0\n' > checks1/oven-check
printf '#!/bin/sh\nexit 0\n' > checks1/till-check
chmod +x checks1/oven-check checks1/till-check

# Then it runs your script so that the shell finds those programs by name,
# and shows you what the script printed.
actual=$(PATH="$PWD/checks1:$PATH" bash solution.sh)

echo "Your script printed:"
echo "$actual"
echo

expected='Opening checklist
oven status: 0
Oven: start the bread
Checklist done'
assert_eq "$actual" "$expected" "the checklist when the oven is hot and the till holds enough change"
