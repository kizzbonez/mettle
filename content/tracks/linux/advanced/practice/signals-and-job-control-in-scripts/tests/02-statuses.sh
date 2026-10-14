mkdir -p c2 c2-empty c2-good
printf 'exit 128\n' > c2/a.sh
printf 'exit 1\n' > 'c2/b one.sh'
printf 'kill -s KILL "$$"\n' > c2/c.sh
printf 'exit 0\n' > c2/d.sh
printf 'exit 2\n' > c2/e.sh
printf 'exit 9\n' > c2/notes.txt
printf 'exit 0\n' > c2-good/x.sh
printf 'true\n' > c2-good/y.sh

out=$(bash solution.sh c2 2> err2.txt)
status=$?
assert_eq "$out" "a failed (status 128)
b one failed (status 1)
c killed by KILL
d ok
e failed (status 2)
1 of 5 checks passed" "the result lines for checks ending with 128, 1, KILL, 0 and 2, one of them with a space in its name"
assert_eq "$status" "1" "exit status when some checks did not pass"

out=$(bash solution.sh c2-good 2> err2.txt)
status=$?
assert_eq "$out" "x ok
y ok
2 of 2 checks passed" "the result lines when every check passes"
assert_eq "$status" "0" "exit status when every check passes"

out=$(bash solution.sh c2-empty 2> err2.txt)
status=$?
assert_eq "$out" "0 of 0 checks passed" "the output for a directory without checks"
assert_eq "$status" "0" "exit status for a directory without checks"
