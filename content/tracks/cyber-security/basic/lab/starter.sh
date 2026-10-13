#!/usr/bin/env bash
# Usage: bash solution.sh <path-to-auth.log>
#
# Print "<address> <count>" for every source address with 3 or more failed
# password attempts: highest count first, ties ordered by address.
set -u

log="$1"

# TODO 1: keep only the "Failed password" lines of "$log"
# TODO 2: extract the field that follows the word "from"
# TODO 3: count per address and keep counts of 3 or more
# TODO 4: sort by count (descending), then by address (ascending)
