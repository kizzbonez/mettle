#!/usr/bin/env bash
# Usage: bash solution.sh FSTAB BLKID
# Compares /etc/fstab with the output of blkid and prints what would go wrong at the next boot,
# or "fstab ok".
set -u

fstab=$1
blkid=$2

# 1. Read BLKID: remember each device's UUID, LABEL and TYPE.
# 2. Check each line of FSTAB as the instructions describe, in file order.
# 3. Print "fstab ok" when nothing was found.
# YOUR CODE
