out=$(bash solution.sh data/order.txt 2> err.txt)
status=$?
assert_eq "$status" "0" "exit status for data/order.txt"
assert_eq "$out" "BRK-0042 2 x 4.50 = 9.00
CHN-0108 1 x 19.99 = 19.99
TUB-0700 30 x 3.50 = 105.00
total 133.99" "the priced lines and the total on standard output for data/order.txt"
assert_eq "$(cat err.txt)" "parts: skipping unknown part code brk-0042" \
  "the warning on standard error for the line with an unknown part code"
