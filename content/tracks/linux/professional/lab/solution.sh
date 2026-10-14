#!/usr/bin/env bash
# Usage: bash solution.sh BUNDLE ALLOWED_PORTS
#   BUNDLE         a file written by the collection script: one section per command,
#                  each starting with the line "### <command>"
#   ALLOWED_PORTS  comma-separated TCP ports that may listen on the network, e.g. 22,80,443
#                  (may be empty)
#
# Prints one line per finding, then "findings: N".
# Exits with status 1 if there was at least one finding, 0 if there were none.
set -u

bundle=$1
allowed=$2
findings=0

# section NAME: print the lines of the section whose header line is exactly "### NAME",
# without the header, up to (not including) the next line that starts with "### ".
section() {
  awk -v header="### $1" '
    $0 == header { inside = 1; next }
    /^### /      { inside = 0 }
    inside
  ' "$bundle"
}

# df -hT: "disk: <mount point> at <N>%" for every real filesystem at 90% or more.
# Memory filesystems and read-only snap images are full by design, so they are skipped.
check_disk() {
  awk '
    NF == 0 || $1 == "Filesystem" { next }
    $2 == "tmpfs" || $2 == "devtmpfs" || $2 == "squashfs" { next }
    {
      use = $6
      sub(/%$/, "", use)
      if (use + 0 >= 90) printf "disk: %s at %d%%\n", $7, use
    }
  '
}

# systemctl --failed: "unit: <unit> (<description>)" for every failed unit.
# Columns after the marker: UNIT LOAD ACTIVE SUB DESCRIPTION...
check_units() {
  awk '
    $1 == "●" {
      description = $6
      for (i = 7; i <= NF; i++) description = description " " $i
      printf "unit: %s (%s)\n", $2, description
    }
  '
}

# ss -tlnp, with $1 = ALLOWED_PORTS: "port: <port> on <address> by <process>".
check_ports() {
  awk -v allowed="$1" '
    BEGIN {
      n = split(allowed, list, ",")
      for (i = 1; i <= n; i++) ok[list[i]] = 1
    }
    $1 == "LISTEN" {
      # Split at the last colon: IPv6 addresses contain colons of their own.
      at = match($4, /:[^:]*$/)
      address = substr($4, 1, at - 1)
      port = substr($4, at + 1)
      if (address ~ /^127\./ || address == "[::1]") next
      if (port in ok) next
      process = "?"
      if (match($0, /users:\(\("[^"]+"/)) process = substr($0, RSTART + 9, RLENGTH - 10)
      printf "port: %s on %s by %s\n", port, address, process
    }
  '
}

# sshd_config: read it the way sshd does. Keywords are case-insensitive, the first value
# obtained wins, and the global section ends at the first Match line.
check_sshd() {
  awk '
    { sub(/^[ \t]+/, "") }
    $0 == "" || /^#/ { next }
    { keyword = tolower($1) }
    keyword == "match" { exit }
    keyword == "permitrootlogin" && root == "" { root = $2 }
    keyword == "passwordauthentication" && password == "" { password = $2 }
    END {
      if (root == "") root = "prohibit-password"
      if (password == "") password = "yes"
      if (root != "no") printf "sshd: PermitRootLogin is %s (want no)\n", root
      if (password != "no") printf "sshd: PasswordAuthentication is %s (want no)\n", password
    }
  '
}

# getent passwd: "account: <name> has UID 0" for every account other than root.
check_uid0() {
  awk -F: 'NF >= 3 && $3 == "0" && $1 != "root" { printf "account: %s has UID 0\n", $1 }'
}

# getent shadow: "account: <name> has an empty password". "!", "*" and "!*" are locked.
check_empty_passwords() {
  awk -F: 'NF >= 2 && $2 == "" { printf "account: %s has an empty password\n", $1 }'
}

# run_check NAME FUNCTION [ARGS...]: run one check on one section, print and count its findings.
run_check() {
  local name=$1 fn=$2 out
  shift 2
  if ! grep -qxF "### $name" "$bundle"; then
    echo "skip: $name not collected"
    return
  fi
  out=$(section "$name" | "$fn" "$@")
  if [ -n "$out" ]; then
    printf '%s\n' "$out"
    findings=$(( findings + $(printf '%s\n' "$out" | wc -l) ))
  fi
}

run_check "df -hT" check_disk
run_check "systemctl --failed" check_units
run_check "ss -tlnp" check_ports "$allowed"
run_check "cat /etc/ssh/sshd_config" check_sshd
run_check "getent passwd" check_uid0
run_check "getent shadow" check_empty_passwords

echo "findings: $findings"
if [ "$findings" -gt 0 ]; then
  exit 1
fi
exit 0
