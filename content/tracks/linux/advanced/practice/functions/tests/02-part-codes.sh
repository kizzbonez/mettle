sourced=$(source ./solution.sh 2>&1; echo "end of source")
assert_eq "$sourced" "end of source" "sourcing solution.sh must print nothing and must not run main"
source ./solution.sh

# check_code CODE EXPECTED_STATUS
check_code() {
  local code=$1 expected=$2 out status
  out=$(is_part_code "$code")
  status=$?
  assert_eq "$status" "$expected" "the status of is_part_code for the code '$code'"
  assert_eq "$out" "" "is_part_code prints nothing (code '$code')"
}

check_code BRK-0042 0
check_code ZZZ-9999 0
check_code AAA-0000 0
check_code brk-0042 1
check_code Brk-0042 1
check_code BRK-042 1
check_code BRK-00420 1
check_code XBRK-0042 1
check_code BR1-0042 1
check_code BRK-004a 1
check_code BRK_0042 1
check_code "BRK 0042" 1
check_code "BRK-0042 " 1
check_code " BRK-0042" 1
check_code "" 1
