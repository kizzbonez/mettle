command -v shellcheck > /dev/null || fail "ShellCheck is not available in the sandbox"
findings=$(shellcheck -f gcc solution.sh 2>&1) \
  || fail "ShellCheck must report nothing for solution.sh, but it found:
$findings"
