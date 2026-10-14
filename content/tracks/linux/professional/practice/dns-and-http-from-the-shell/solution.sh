#!/usr/bin/env bash
# Usage: bash solution.sh HOSTS ANSWERS
# Prints every name whose /etc/hosts address is not one of its DNS addresses,
# or "hosts and DNS agree".
set -u

hosts=$1
answers=$2

awk '
  function clean(name) {
    name = tolower(name)
    sub(/\.$/, "", name)
    return name
  }
  function remember(owner) {
    if (!(owner in seen)) {
      seen[owner] = 1
      order[++count] = owner
    }
  }

  # 1. HOSTS, read first: the first IPv4 line that lists a name wins.
  FNR == NR {
    sub(/#.*/, "")
    if (NF < 2 || $1 ~ /:/) next
    for (i = 2; i <= NF; i++) {
      name = clean($i)
      if (!(name in pinned)) pinned[name] = $1
    }
    next
  }

  # 2. ANSWERS: OWNER TTL CLASS TYPE DATA
  $4 == "A" {
    owner = clean($1)
    remember(owner)
    addresses[owner] = (owner in addresses) ? addresses[owner] " " $5 : $5
  }
  $4 == "CNAME" {
    owner = clean($1)
    remember(owner)
    alias[owner] = clean($5)
  }

  # 3. Compare.
  END {
    for (i = 1; i <= count; i++) {
      name = order[i]
      target = name
      for (hops = 0; (target in alias) && hops < 10; hops++) target = alias[target]
      if (!(name in pinned) || !(target in addresses)) continue
      if (index(" " addresses[target] " ", " " pinned[name] " ") > 0) continue
      print name ": /etc/hosts says " pinned[name] ", DNS says " addresses[target]
      conflicts++
    }
    if (conflicts == 0) print "hosts and DNS agree"
  }
' "$hosts" "$answers"
