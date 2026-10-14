expected='DB-310
HR-0042
NET-1043
OPS-7781
lines without a ticket: 3'

actual=$(bash solution.sh data/standup.txt) || fail "solution.sh exited with a non-zero status for data/standup.txt"
assert_eq "$actual" "$expected" "the IDs and the count for the sample file data/standup.txt"
