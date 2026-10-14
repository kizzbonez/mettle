#!/usr/bin/env bash
# Usage: bash solution.sh FILE
#
# Decide whether FILE may be uploaded: print "accepted: KIND" or
# "rejected: REASON", and exit with 0, 1 or 2 as the instructions say.

# YOUR CODE: check that there is exactly one argument (usage, exit 2).

file="$1"

# YOUR CODE: check that "$file" is a regular file (not a file, exit 2).

# YOUR CODE: reject an empty file.

# YOUR CODE: a case on "$file" that sets kind and limit, or rejects the type.

# YOUR CODE: compare the size with the limit, then accept.
