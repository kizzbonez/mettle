mkdir -p tmp2
export TMPDIR=$PWD/tmp2

# run_ok DESCRIPTION READINGS_TEXT EXPECTED_REPORT
run_ok() {
  local what=$1 out
  printf '%s' "$2" > in2.txt
  rm -f report2.txt
  out=$(bash solution.sh in2.txt report2.txt 2> err.txt)
  assert_eq "$?" "0" "$what: exit status"
  assert_eq "$out" "" "$what: nothing on standard output"
  assert_eq "$(cat err.txt)" "" "$what: nothing on standard error"
  [[ -f report2.txt ]] || fail "$what: REPORT is created"
  assert_eq "$(cat report2.txt)" "$3" "$what: the report"
  assert_eq "$(ls -A tmp2)" "" "$what: the work directory is removed"
}

run_ok "readings without any FAULT line" $'north 40\nsouth 7\neast 300\n' \
  $'readings: 3\nfaults: 0\nhighest: east 300'
run_ok "a single reading of 0" $'solo 0\n' \
  $'readings: 1\nfaults: 0\nhighest: solo 0'
run_ok "only FAULT lines" $'x FAULT\ny FAULT\n' \
  $'readings: 0\nfaults: 2\nhighest: none'
run_ok "an empty READINGS file" '' \
  $'readings: 0\nfaults: 0\nhighest: none'
run_ok "values of different lengths" $'a 9\nb 10\nc FAULT\nd 100\ne 99\n' \
  $'readings: 4\nfaults: 1\nhighest: d 100'
