mkdir -p checks2
printf '#!/bin/sh\nexit 3\n' > checks2/oven-check
printf '#!/bin/sh\nexit 0\n' > checks2/till-check
chmod +x checks2/oven-check checks2/till-check

actual=$(PATH="$PWD/checks2:$PATH" bash solution.sh)

expected='Opening checklist
oven status: 3
Checklist done'
assert_eq "$actual" "$expected" "the checklist when the oven is still heating up and the till holds enough change"
