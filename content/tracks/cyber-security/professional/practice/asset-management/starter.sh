#!/usr/bin/env bash
# Usage: bash solution.sh INVENTORY DISCOVERY CERTIFICATES
# Reconciles the asset inventory with discovery data and certificates of sanitization.
set -u

inventory=$1
discovery=$2
certificates=$3

# 1. and 2. Find unknown, retired, missing and uncertified assets: one awk program can read
#    "$inventory" "$discovery" "$certificates" in turn (skip each header and empty lines).
#    Compare MACs in lower case. Print the lines through LC_ALL=C sort -u.
# YOUR CODE
report=""

# 3. Print the sorted lines and exit 1, or "inventory reconciled" and exit 0.
# YOUR CODE
