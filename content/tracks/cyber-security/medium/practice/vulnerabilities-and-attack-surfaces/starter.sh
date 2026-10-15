#!/usr/bin/env bash
# Usage: bash solution.sh TODAY INVENTORY
# Lists the hosts in an asset inventory that are unsupported, unpatched, unmanaged,
# exposing management ports to the internet or without an owner.
set -u

today=$1
inventory=$2

# 1. The oldest patch date that still counts as patched: 30 days before TODAY.
#    GNU date can do the arithmetic: date -d "2026-10-16 -30 days" +%F
# YOUR CODE

# 2. Read the inventory (skip comments, blank lines and the header; remove a trailing \r).
#    Print "HOST: finding finding ..." for each host with findings, in file order, then
#    "N of M hosts need action". Exit with status 1 if N > 0, otherwise 0.
# YOUR CODE
