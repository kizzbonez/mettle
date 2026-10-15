#!/usr/bin/env bash
# Usage: bash solution.sh POLICY CHECKS
# Tests a zone policy (first match wins, default deny) against the expected isolation.
set -u

policy=$1
checks=$2

# 1. The rules in evaluation order: no blank lines, comments or header, lower case,
#    sorted by seq as a number.
# YOUR CODE

# 2. decide FROM TO PROTO PORT prints "allow (rule 30)", "deny (rule 90)" or "deny (default)".
decide() {
  # YOUR CODE
  :
}

# 3. For each check: PASS or FAIL, the connection and the decision. Then the summary line,
#    and exit 1 if any check failed.
# YOUR CODE
