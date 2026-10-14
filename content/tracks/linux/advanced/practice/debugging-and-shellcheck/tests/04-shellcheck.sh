command -v shellcheck > /dev/null || fail "ShellCheck is not available in the sandbox"
if grep -q 'shellcheck disable' solution.sh; then
  fail "solution.sh fixes ShellCheck's findings instead of disabling them"
fi
findings=$(shellcheck -f gcc solution.sh 2>&1) \
  || fail "ShellCheck must report nothing for solution.sh, but it found:
$findings"
