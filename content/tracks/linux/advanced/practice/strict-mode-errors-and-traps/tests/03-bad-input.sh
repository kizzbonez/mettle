mkdir -p tmp3 adir
export TMPDIR=$PWD/tmp3
old_report=$'readings: 1\nfaults: 0\nhighest: old 1'
printf '%s\n' "$old_report" > report3.txt

# check_failure DESCRIPTION READINGS EXPECTED_MESSAGE
check_failure() {
  local what=$1 out
  out=$(bash solution.sh "$2" report3.txt 2> err.txt)
  assert_eq "$?" "1" "$what: exit status"
  assert_eq "$out" "" "$what: nothing on standard output"
  assert_eq "$(cat err.txt)" "$3" "$what: the message on standard error"
  assert_eq "$(cat report3.txt)" "$old_report" "$what: an existing REPORT is left unchanged"
  assert_eq "$(ls -A tmp3)" "" "$what: the work directory is removed"
}

printf 'm-01 5\nm-02 7\nm-03 12.5\n' > decimal.txt
check_failure "a decimal value" decimal.txt "meters: bad value on line 3: 12.5"

printf 'm-01 -5\n' > negative.txt
check_failure "a negative value on the first line" negative.txt "meters: bad value on line 1: -5"

printf 'm-01 FAULT\nm-02 1,200\nm-03 4\n' > comma.txt
check_failure "a value with a comma after a FAULT line" comma.txt "meters: bad value on line 2: 1,200"

check_failure "a READINGS file that does not exist" nope.txt "meters: cannot read nope.txt"
check_failure "a READINGS path that is a directory" adir "meters: cannot read adir"
