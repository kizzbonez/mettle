sourced=$(source ./solution.sh 2>&1; echo "end of source")
assert_eq "$sourced" "end of source" "sourcing solution.sh must print nothing and must not run main"
source ./solution.sh

for pair in "0 0.00" "5 0.05" "10 0.10" "99 0.99" "100 1.00" "950 9.50" "28500 285.00" "123456 1234.56"; do
  read -r cents euros <<< "$pair"
  assert_eq "$(cents_to_euros "$cents")" "$euros" "the output of cents_to_euros $cents"
done

for triple in "30 950 28500" "0 450 0" "1 1999 1999" "256 1 256" "12 25 300"; do
  read -r qty unit cost <<< "$triple"
  assert_eq "$(line_cost "$qty" "$unit")" "$cost" "the output of line_cost $qty $unit"
done

# A whole order whose single line costs far more than 255 cents.
printf 'SAD-0001 300 999\n' > big-order.txt
out=$(bash solution.sh big-order.txt 2> err.txt)
assert_eq "$?" "0" "exit status for an order with one large line"
assert_eq "$out" "SAD-0001 300 x 9.99 = 2997.00
total 2997.00" "the priced line and the total for an order of 300 parts at 999 cents"
assert_eq "$(cat err.txt)" "" "nothing on standard error when every part code is valid"
