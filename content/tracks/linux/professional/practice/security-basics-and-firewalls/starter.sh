#!/usr/bin/env bash
# Usage: bash solution.sh DIR BASELINE
# Compares the setuid and setgid files under DIR with a saved list of "MODE PATH" lines.
set -u

dir=$1
baseline=$2

# 1. The setuid and setgid files under $dir now, with their modes.
# YOUR CODE

# 2. The files and modes in $baseline (skip empty lines and comments).
# YOUR CODE

# 3. Print the new, changed and gone files, each group sorted by path in byte order.
#    Print "no changes" and exit 0 if there are none; otherwise exit 1.
# YOUR CODE
