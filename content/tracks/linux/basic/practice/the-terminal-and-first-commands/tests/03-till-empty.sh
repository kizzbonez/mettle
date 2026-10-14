mkdir -p checks3
printf '#!/bin/sh\nexit 0\n' > checks3/oven-check
printf '#!/bin/sh\nexit 1\n' > checks3/till-check
chmod +x checks3/oven-check checks3/till-check

actual=$(PATH="$PWD/checks3:$PATH" bash solution.sh)

expected='Opening checklist
oven status: 0
Oven: start the bread
Till: fetch change from the bank
Checklist done'
assert_eq "$actual" "$expected" "the checklist when the oven is hot but the till lacks change"
