#!/usr/bin/env bash
# Usage: bash solution.sh REGISTER AS_OF
# Checks a governance document register against the association's policy on policies.
set -u

register=$1
as_of=$2
findings=0

# Read each row (skip the header and empty lines) and, in this order, print:
#   1. NO-OWNER ID            2. UNAPPROVED ID
#   3. WRONG-APPROVER ID (APPROVER) for a policy not approved by Board or Executive Committee
#   4. CYCLE ID (N months)    more than 12 months, or more than 24 for a guideline
#   5. OVERDUE ID (due DATE)  due=$(date -d "$approved +$months months" +%F) before $as_of
# Count what you print in $findings.
# YOUR CODE

# Print "register in order" and exit 0 when nothing was found; otherwise exit 1.
# YOUR CODE
