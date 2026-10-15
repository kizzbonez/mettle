#!/usr/bin/env bash
# Usage: bash solution.sh EVE SUPPRESS
# Triage of Suricata alerts: suppressions left out, groups needing a follow-up first.
set -u

eve=$1
suppress=$2

# 1. The suppressions from $suppress (skip blank lines and comments): the sig_id, and the
#    track (by_src or by_dst) and ip when the line has them.
#    One "SID TRACK IP" line each, with TRACK "all" and IP "-" when there is no track.
rules=$(grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$suppress" | tr ',' ' ' | awk '{
  sid = ""; track = "all"; ip = "-"
  for (i = 1; i < NF; i++) {
    if ($i == "sig_id") sid = $(i + 1)
    else if ($i == "track") track = $(i + 1)
    else if ($i == "ip") ip = $(i + 1)
  }
  print sid, track, ip
}')

# 2. The alerts from $eve (event_type "alert" only) with severity, src_ip, dest_ip,
#    signature_id, action and signature. jq -r '... | @tsv' gives tab-separated lines.
alerts=$(jq -r 'select(.event_type == "alert")
  | [.alert.severity, .src_ip, .dest_ip, .alert.signature_id, .alert.action, .alert.signature]
  | @tsv' "$eve")

# 3. Leave out suppressed alerts, group by signature_id and src_ip, count each group and
#    note whether any alert in it was allowed.
#    Output: rank (0 follow-up, 1 blocked), severity, count, src, sid, signature.
groups=$(awk -F'\t' '
  FNR == NR { if (split($0, r, " ") == 3) suppressed[r[1] " " r[2] " " r[3]] = 1; next }
  NF < 6 { next }
  {
    sev = $1; src = $2; dst = $3; sid = $4; action = $5; sig = $6
    if ((sid " all -") in suppressed || (sid " by_src " src) in suppressed || (sid " by_dst " dst) in suppressed) next
    key = sid "\t" src
    count[key]++
    severity[key] = sev
    name[key] = sig
    if (action != "blocked") follow[key] = 1
  }
  END {
    for (key in count) {
      split(key, k, "\t")
      printf "%d\t%s\t%d\t%s\t%s\t%s\n", (key in follow) ? 0 : 1, severity[key], count[key], k[2], k[1], name[key]
    }
  }' <(printf '%s\n' "$rules") <(printf '%s\n' "$alerts"))

# 4. Print FOLLOW-UP groups, then BLOCKED groups, each sorted by severity, count (largest
#    first), source address (LC_ALL=C) and signature ID:
#    STATUS sevSEVERITY SRC_IP sid:SID xCOUNT SIGNATURE
#    Exit 1 if there is a FOLLOW-UP line.
[ -z "$groups" ] && exit 0
printf '%s\n' "$groups" | LC_ALL=C sort -t$'\t' -k1,1n -k2,2n -k3,3nr -k4,4 -k5,5n | awk -F'\t' '
  { printf "%s sev%s %s sid:%s x%s %s\n", ($1 == 0) ? "FOLLOW-UP" : "BLOCKED", $2, $4, $5, $3, $6 }
  $1 == 0 { follow = 1 }
  END { exit follow ? 1 : 0 }'
