#!/usr/bin/env bash
# Usage: bash solution.sh REGISTER AS_OF
# Checks a governance document register against the association's policy on policies.
set -u

register=$1
as_of=$2
findings=0

report() {
  echo "$1"
  findings=$(( findings + 1 ))
}

while IFS=, read -r id title type owner approver approved months; do
  [ "$id" = "id" ] && continue
  [ -z "$id" ] && continue
  type=${type,,}

  # 1. and 2. Owner and approver.
  [ -z "$owner" ] && report "NO-OWNER $id"
  [ -z "$approver" ] && report "UNAPPROVED $id"

  # 3. Policies are approved by senior management.
  if [ "$type" = "policy" ] && [ -n "$approver" ] &&
     [ "$approver" != "Board" ] && [ "$approver" != "Executive Committee" ]; then
    report "WRONG-APPROVER $id ($approver)"
  fi

  # 4. Review cycle.
  limit=12
  [ "$type" = "guideline" ] && limit=24
  (( months > limit )) && report "CYCLE $id ($months months)"

  # 5. Next review date.
  due=$(date -d "$approved +$months months" +%F)
  [[ $due < $as_of ]] && report "OVERDUE $id (due $due)"
done < "$register"

if [ "$findings" -eq 0 ]; then
  echo "register in order"
  exit 0
fi
exit 1
