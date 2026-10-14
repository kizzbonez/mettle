sourced=$(source ./solution.sh 2>&1; echo "end of source")
assert_eq "$sourced" "end of source" "sourcing solution.sh must print nothing and must not run main"
source ./solution.sh

# Variables the caller already has must survive, and no new ones may appear.
code=keep qty=keep unit=keep cost=keep total=keep cents=keep euros=keep
n=keep result=keep value=keep price=keep amount=keep
compgen -v | LC_ALL=C sort > vars-before.txt
is_part_code BRK-0042 > /dev/null
is_part_code nope > /dev/null
line_cost 3 450 > cost.txt
cents_to_euros 1350 > euros.txt
compgen -v | LC_ALL=C sort > vars-after.txt

assert_eq "$(cat cost.txt)" "1350" "the output of line_cost 3 450, called directly"
assert_eq "$(cat euros.txt)" "13.50" "the output of cents_to_euros 1350, called directly"
new_vars=$(comm -13 vars-before.txt vars-after.txt | grep -vx -e BASH_REMATCH -e _ | tr '\n' ' ')
assert_eq "$new_vars" "" "global variables created by calling is_part_code, line_cost and cents_to_euros"
for name in code qty unit cost total cents euros n result value price amount; do
  assert_eq "${!name}" "keep" "the caller's variable '$name' after calling the functions"
done

# die prints one line on standard error and exits with status 1.
( die "out of stock" ) > die-out.txt 2> die-err.txt
assert_eq "$?" "1" "the exit status of die"
assert_eq "$(cat die-out.txt)" "" "die prints nothing on standard output"
assert_eq "$(cat die-err.txt)" "parts: out of stock" "the message die prints on standard error"

# An order file that cannot be read.
out=$(bash solution.sh no-such-order.txt 2> err.txt)
assert_eq "$?" "1" "the exit status for an order file that does not exist"
assert_eq "$out" "" "nothing on standard output for an order file that does not exist"
assert_eq "$(cat err.txt)" "parts: cannot read no-such-order.txt" \
  "the message on standard error for an order file that does not exist"
