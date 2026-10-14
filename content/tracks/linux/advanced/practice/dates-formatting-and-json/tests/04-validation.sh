printf 'from an earlier run\n' > overdue.jsonl

# check_bad_date DATE
check_bad_date() {
  local out status
  out=$(bash solution.sh data/loans.json "$1" 2> err4.txt)
  status=$?
  assert_eq "$status" "2" "exit status for the DATE '$1'"
  assert_eq "$out" "" "nothing on standard output for the DATE '$1'"
  assert_eq "$(cat err4.txt)" "loans: invalid date: $1" "the message on standard error for the DATE '$1'"
  assert_eq "$(cat overdue.jsonl)" "from an earlier run" "overdue.jsonl is not touched for the DATE '$1'"
}
check_bad_date 2026-02-30
check_bad_date 2026-13-01
check_bad_date 14/10/2026
check_bad_date 2026-1-5
check_bad_date 2026-10-14x
check_bad_date tomorrow
check_bad_date ''

out=$(bash solution.sh nope.json 2026-10-14 2> err4.txt)
assert_eq "$?" "1" "exit status for a LOANS file that does not exist"
assert_eq "$out" "" "nothing on standard output for a LOANS file that does not exist"
assert_eq "$(cat err4.txt)" "loans: cannot read nope.json" "the message for a LOANS file that does not exist"
assert_eq "$(cat overdue.jsonl)" "from an earlier run" "overdue.jsonl is not touched when LOANS does not exist"
