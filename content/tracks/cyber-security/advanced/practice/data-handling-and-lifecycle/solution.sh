#!/usr/bin/env bash
# Usage: bash solution.sh SCHEDULE RECORDS HOLDS REVIEW_DATE
# Applies a retention schedule and legal holds to a records inventory on REVIEW_DATE.
set -u

schedule=$1
records=$2
holds=$3
today=$4

# 1. The schedule: retain, trigger and disposal for each category (skip the header and blank lines).
declare -A retain=() trigger=() disposal=()
while IFS=, read -r category period field method; do
  [ -z "$category" ] && continue
  retain[$category]=$period
  trigger[$category]=$field
  disposal[$category]=$method
done < <(tail -n +2 "$schedule")

# 2. The holds that are active on $today: issued <= today, and released empty or > today.
#    Keep them in file order with what they apply to.
hold_ids=()
hold_targets=()
while IFS=, read -r hold_id applies_to issued released; do
  [ -z "$hold_id" ] && continue
  [[ $issued > $today ]] && continue
  [ -n "$released" ] && ! [[ $released > $today ]] && continue
  hold_ids+=("$hold_id")
  hold_targets+=("$applies_to")
done < <(tail -n +2 "$holds")

# 3. Each record, in file order: REVIEW, HOLD, KEEP open, DISPOSE or KEEP until.
#    Count each kind for the summary line.
dispose=0 hold=0 keep=0 review=0
while IFS=, read -r id category created closed; do
  [ -z "$id" ] && continue
  if [ -z "${retain[$category]+set}" ]; then
    echo "REVIEW $id no-schedule"
    review=$(( review + 1 ))
    continue
  fi
  held=""
  for i in "${!hold_ids[@]}"; do
    if [ "${hold_targets[$i]}" = "$id" ] || [ "${hold_targets[$i]}" = "category:$category" ]; then
      held=${hold_ids[$i]}
      break
    fi
  done
  if [ -n "$held" ]; then
    echo "HOLD $id $held"
    hold=$(( hold + 1 ))
    continue
  fi
  if [ "${trigger[$category]}" = closed ]; then start=$closed; else start=$created; fi
  if [ -z "$start" ]; then
    echo "KEEP $id open"
    keep=$(( keep + 1 ))
    continue
  fi
  period=${retain[$category]}
  case $period in
    *y) due=$(date -d "$start +${period%y} years" +%F) ;;
    *d) due=$(date -d "$start +${period%d} days" +%F) ;;
  esac
  if [[ $today < $due ]]; then
    echo "KEEP $id until $due"
    keep=$(( keep + 1 ))
  else
    echo "DISPOSE $id due $due ${disposal[$category]}"
    dispose=$(( dispose + 1 ))
  fi
done < <(tail -n +2 "$records")

# 4. SUMMARY <d> dispose, <h> hold, <k> keep, <r> review
echo "SUMMARY $dispose dispose, $hold hold, $keep keep, $review review"
