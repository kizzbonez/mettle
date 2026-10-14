mkdir -p tmp4
export TMPDIR=$PWD/tmp4

out=$(bash solution.sh data/readings.txt no-such-dir/report.txt 2> err.txt)
assert_eq "$?" "1" "exit status when the report cannot be moved into place"
assert_eq "$out" "" "nothing on standard output when the report cannot be moved into place"
[[ ! -e no-such-dir ]] || fail "no REPORT directory is created when the move fails"
assert_eq "$(ls -A tmp4)" "" "the work directory is removed after an unexpected failure"

trap_line=$(grep -E '^meters: line [0-9]+: .+ failed$' err.txt | head -n 1)
[[ -n $trap_line ]] || fail "the ERR trap prints 'meters: line N: COMMAND failed' when a command fails"
[[ $trap_line == "meters: line "*": mv "*" failed" ]] \
  || fail "the ERR trap names the command that failed, read from \$BASH_COMMAND when the trap runs"

mv_line=$(grep -n -E '^[[:space:]]*mv ' solution.sh | head -n 1 | cut -d: -f1)
[[ $trap_line == "meters: line $mv_line: "* ]] \
  || fail "the ERR trap reports the line of the command that failed, read from \$LINENO when the trap runs"
