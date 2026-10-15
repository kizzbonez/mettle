#!/usr/bin/env bash
# Usage: bash solution.sh BASELINE DIR
# Compares the kernel settings the *.conf files in DIR apply (last value wins) with a baseline.
set -u
export LC_ALL=C
shopt -s nullglob

baseline=$1
dir=$2

declare -A value=()    # key -> the last value set
declare -A origin=()   # key -> the file name that set it

# 1. Every *.conf file in DIR, in byte order of names; a later value overrides an earlier one.
#    Skip blank lines, # and ; comments, and lines without "=". Trim spaces and tabs, drop a
#    leading "-" from the key and turn "/" into ".".
# YOUR CODE

# 2. For each "KEY WANT DEFAULT" line of the baseline: the effective value and its source
#    (a file name or "default"), then
#    STATUS KEY VALUE (SOURCE; baseline WANT)
#    Exit 1 if any check failed.
# YOUR CODE
