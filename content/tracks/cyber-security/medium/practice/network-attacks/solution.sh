#!/usr/bin/env bash
# Usage: bash solution.sh LOG GATEWAY
# Finds ARP spoofing (arpwatch) and rogue DHCP servers (DHCP snooping drops) in a syslog file.
set -u

log=$1
gateway=$2

awk -v gateway="$gateway" '
  # 1. A MAC address as six lower-case two-digit groups joined by colons.
  function norm(mac,    parts, n, i, out, group) {
    mac = tolower(mac)
    if (mac ~ /\./) {                       # Cisco style: 000c.295e.a107
      gsub(/\./, "", mac)
      for (i = 1; i <= 11; i += 2) out = out (i > 1 ? ":" : "") substr(mac, i, 2)
      return out
    }
    n = split(mac, parts, ":")              # arpwatch style: 0:c:29:5e:a1:7
    for (i = 1; i <= n; i++) {
      group = parts[i]
      if (length(group) == 1) group = "0" group
      out = out (i > 1 ? ":" : "") group
    }
    return out
  }

  # 2. ARP changes: "changed ethernet address IP NEW (OLD)" and "flip flop IP NEW (OLD)".
  / arpwatch: (changed ethernet address|flip flop) / {
    for (i = 1; i <= NF; i++) if ($i == "address" || $i == "flop") break
    ip = $(i + 1)
    old = $(i + 3)
    gsub(/[()]/, "", old)
    if (!(ip in changes)) arp[++arps] = ip
    changes[ip]++
    seen[ip, norm($(i + 2))] = 1
    seen[ip, norm(old)] = 1
  }

  # 3. Server messages dropped on untrusted ports.
  /DHCP_SNOOPING_UNTRUSTED_PORT/ && /message type: DHCP(OFFER|ACK),/ {
    mac = norm($NF)
    if (!(mac in dropped)) dhcp[++dhcps] = mac
    dropped[mac]++
  }

  END {
    if (arps + dhcps == 0) {
      print "no spoofing seen"
      exit 0
    }
    for (k = 1; k <= arps; k++) {
      ip = arp[k]
      n = 0
      delete list
      for (key in seen) {
        split(key, pair, SUBSEP)
        if (pair[1] == ip) list[++n] = pair[2]
      }
      asort(list)
      macs = list[1]
      for (j = 2; j <= n; j++) macs = macs "," list[j]
      print "arp " ip " changes=" changes[ip] " macs=" macs (ip == gateway ? " gateway" : "")
    }
    for (k = 1; k <= dhcps; k++) print "dhcp " dhcp[k] " dropped=" dropped[dhcp[k]]
    exit (gateway in changes) ? 2 : 1
  }
' "$log"
