#!/usr/bin/env bash
# Usage: bash solution.sh EVE SUPPRESS
# Triage of Suricata alerts: suppressions left out, groups needing a follow-up first.
set -u

eve=$1
suppress=$2

# 1. The suppressions from $suppress (skip blank lines and comments): the sig_id, and the
#    track (by_src or by_dst) and ip when the line has them.
# YOUR CODE

# 2. The alerts from $eve (event_type "alert" only) with severity, src_ip, dest_ip,
#    signature_id, action and signature. jq -r '... | @tsv' gives tab-separated lines.
# YOUR CODE

# 3. Leave out suppressed alerts, group by signature_id and src_ip, count each group and
#    note whether any alert in it was allowed.
# YOUR CODE

# 4. Print FOLLOW-UP groups, then BLOCKED groups, each sorted by severity, count (largest
#    first), source address (LC_ALL=C) and signature ID:
#    STATUS sevSEVERITY SRC_IP sid:SID xCOUNT SIGNATURE
#    Exit 1 if there is a FOLLOW-UP line.
# YOUR CODE
