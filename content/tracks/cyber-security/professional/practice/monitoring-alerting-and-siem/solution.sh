#!/usr/bin/env bash
# Usage: bash solution.sh LOG THRESHOLD MINUTES CANARIES
# Alerts on password spraying from one source and on any use of a canary account.
set -u

log=$1
threshold=$2
minutes=$3
canaries=$4

alerts=$(awk -v threshold="$threshold" -v window=$(( minutes * 60 )) '
  # The canary accounts.
  ARGIND == 1 {
    if ($0 !~ /^[[:space:]]*(#|$)/) canary[$1] = 1
    next
  }

  # 1. Only sshd lines with facility 4 or 10, and only failures and successes.
  {
    pri = substr($1, 2, index($1, ">") - 2)
    facility = int(pri / 8)
    if ((facility != 4 && facility != 10) || $4 != "sshd") next
    ts = $2
    if (match($0, /Failed password for (invalid user )?([^ ]+) from ([^ ]+) port/, m)) {
      user = m[2]; ip = m[3]; failed = 1
    } else if (match($0, /Accepted [^ ]+ for ([^ ]+) from ([^ ]+) port/, m)) {
      user = m[1]; ip = m[2]; failed = 0
    } else {
      next
    }

    # 2. Canary accounts.
    if (user in canary) print "CANARY " user " from " ip " at " ts

    # 3. Different accounts this source failed on within the window.
    if (!failed || (ip in sprayed)) next
    now = mktime(gensub(/[-T:]/, " ", "g", substr(ts, 1, 19)), 1)
    n = ++count[ip]
    when[ip, n] = now
    who[ip, n] = user
    split("", accounts)
    distinct = 0
    for (i = 1; i <= n; i++) {
      if (now - when[ip, i] <= window && !(who[ip, i] in accounts)) {
        accounts[who[ip, i]] = 1
        distinct++
      }
    }
    if (distinct >= threshold) {
      print "SPRAY " ip " at " ts
      sprayed[ip] = 1
    }
  }
' "$canaries" "$log")

# 4. Print the alerts and exit 1, or "no alerts" and exit 0.
if [ -z "$alerts" ]; then
  echo "no alerts"
  exit 0
fi
printf '%s\n' "$alerts"
exit 1
