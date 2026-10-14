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
  # YOUR CODE
  :
}

# Each check reads its section on standard input and prints its findings, one per line.

# df -hT: "disk: <mount point> at <N>%" for every real filesystem at 90% or more.
check_disk() {
  # YOUR CODE
  :
}

# systemctl --failed: "unit: <unit> (<description>)" for every failed unit.
check_units() {
  # YOUR CODE
  :
}

# ss -tlnp, with $1 = ALLOWED_PORTS: "port: <port> on <address> by <process>".
check_ports() {
  # YOUR CODE
  :
}

# sshd_config: "sshd: <Keyword> is <value> (want no)" for PermitRootLogin, then
# PasswordAuthentication, when the value sshd would use is not "no".
check_sshd() {
  # YOUR CODE
  :
}

# getent passwd: "account: <name> has UID 0" for every account other than root.
check_uid0() {
  # YOUR CODE
  :
}

# getent shadow: "account: <name> has an empty password".
check_empty_passwords() {
  # YOUR CODE
  :
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

# YOUR CODE: print "findings: N", then exit with status 1 if N > 0, or 0 if not.
