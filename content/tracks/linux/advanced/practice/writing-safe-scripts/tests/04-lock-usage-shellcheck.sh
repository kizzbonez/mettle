mkdir -p ro4 d4
chmod 555 ro4
export TMPDIR=$PWD/ro4
printf 'alpha\n' > d4/list.txt

# The test itself holds the lock, as another run would.
exec 8> d4/list.txt.lock
flock -n 8 || fail "the test could not take the lock for its own check"
out=$(bash solution.sh d4/list.txt delta 2> err4.txt)
assert_eq "$?" "3" "exit status while another process holds the lock"
assert_eq "$out" "" "nothing on standard output while another process holds the lock"
assert_eq "$(cat err4.txt)" "allowlist: d4/list.txt is locked by another run" \
  "the message on standard error while another process holds the lock"
assert_eq "$(cat d4/list.txt)" "alpha" "LIST is unchanged while another process holds the lock"
assert_eq "$(ls -A d4)" "list.txt
list.txt.lock" "no temporary file is left while another process holds the lock"
exec 8>&-

out=$(bash solution.sh d4/list.txt delta 2> err4.txt)
assert_eq "$?" "0" "exit status once the lock is free again"
assert_eq "$out" "added delta
1 added" "the output once the lock is free again"

out=$(bash solution.sh 2> err4.txt)
assert_eq "$?" "2" "exit status with no arguments"
out=$(bash solution.sh d4/other.txt 2> err4.txt)
assert_eq "$?" "2" "exit status with LIST but no ENTRY"
assert_eq "$(cat err4.txt)" "allowlist: usage: solution.sh LIST ENTRY..." "the usage message"
[[ ! -e d4/other.txt && ! -e d4/other.txt.lock ]] || fail "incorrect usage creates no files"

command -v shellcheck > /dev/null || fail "ShellCheck is not available in the sandbox"
if grep -q 'shellcheck disable' solution.sh; then
  fail "solution.sh fixes ShellCheck's findings instead of disabling them"
fi
findings=$(shellcheck -f gcc solution.sh 2>&1) \
  || fail "ShellCheck must report nothing for solution.sh, but it found:
$findings"
