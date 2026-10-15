#!/usr/bin/env bash
# Usage: bash solution.sh LOG THRESHOLD MINUTES CANARIES
# Alerts on password spraying from one source and on any use of a canary account.
set -u

log=$1
threshold=$2
minutes=$3
canaries=$4

# One awk program can read "$canaries" first, then "$log" (ARGIND is 1, then 2).
#   1. Keep only sshd lines whose facility (PRI / 8) is 4 or 10, and only the
#      "Failed password for ..." and "Accepted ... for ..." messages.
#   2. Print "CANARY USER from IP at TIMESTAMP" for a canary account.
#   3. For a failure, count the different accounts the same IP failed on in the last
#      MINUTES minutes (inclusive, whole seconds); at THRESHOLD print "SPRAY IP at TIMESTAMP"
#      once per IP.
# YOUR CODE
alerts=""

# 4. Print the alerts and exit 1, or "no alerts" and exit 0.
# YOUR CODE
