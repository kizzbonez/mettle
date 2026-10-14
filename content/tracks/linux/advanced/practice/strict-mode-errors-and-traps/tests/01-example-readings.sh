mkdir -p tmp1
export TMPDIR=$PWD/tmp1

out=$(bash solution.sh data/readings.txt report1.txt 2> err.txt)
assert_eq "$?" "0" "exit status for data/readings.txt"
assert_eq "$out" "" "nothing on standard output for a successful run"
assert_eq "$(cat err.txt)" "" "nothing on standard error for a successful run"
[[ -f report1.txt ]] || fail "REPORT is created by a successful run"
assert_eq "$(cat report1.txt)" "readings: 3
faults: 1
highest: m-03 2210" "the report written for data/readings.txt"
assert_eq "$(ls -A tmp1)" "" "the work directory is removed after a successful run"
