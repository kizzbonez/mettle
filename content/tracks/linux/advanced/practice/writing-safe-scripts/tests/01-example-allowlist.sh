mkdir -p ro1 d1
chmod 555 ro1
export TMPDIR=$PWD/ro1
cat data/allow.txt > d1/allow.txt

out=$(bash solution.sh d1/allow.txt web02 'db 01' --help web02 2> err1.txt)
assert_eq "$?" "0" "exit status for the example"
assert_eq "$out" "added web02
added --help
2 added" "the lines printed for the example"
assert_eq "$(cat d1/allow.txt)" "web01
db 01
web02
--help" "the allowlist after the example"

out=$(bash solution.sh d1/allow.txt web02 2> err1.txt)
assert_eq "$?" "0" "exit status when there is nothing to add"
assert_eq "$out" "0 added" "the output when there is nothing to add"
assert_eq "$(ls -A d1)" "allow.txt
allow.txt.lock" "the files left in LIST's directory"
