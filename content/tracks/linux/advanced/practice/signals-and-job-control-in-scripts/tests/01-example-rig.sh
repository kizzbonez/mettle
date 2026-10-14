mkdir -p rig
cp data/check-*.sh rig/

out=$(bash solution.sh rig 2> err1.txt)
status=$?
assert_eq "$out" "check-dimmers ok
check-fog failed (status 3)
check-hoist killed by TERM
check-sound ok
2 of 4 checks passed" "the result lines printed for the example rig"
assert_eq "$status" "1" "exit status when some checks did not pass"
