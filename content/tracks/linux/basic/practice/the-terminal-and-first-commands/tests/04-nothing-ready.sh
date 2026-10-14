mkdir -p checks4
printf '#!/bin/sh\nexit 2\n' > checks4/oven-check
printf '#!/bin/sh\nexit 1\n' > checks4/till-check
chmod +x checks4/oven-check checks4/till-check

actual=$(PATH="$PWD/checks4:$PATH" bash solution.sh 2> errors4.txt) || fail "solution.sh finished with a non-zero exit status"

expected='Opening checklist
oven status: 2
Till: fetch change from the bank
Checklist done'
assert_eq "$actual" "$expected" "the checklist when the oven is still heating up and the till lacks change"
assert_eq "$(cat errors4.txt)" "" "messages on standard error (a command was not found or complained)"
