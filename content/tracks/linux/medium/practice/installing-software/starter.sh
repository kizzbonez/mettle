#!/usr/bin/env bash
# Usage: bash solution.sh LISTING WANTED
#
# Compare the packages installed according to a saved `dpkg -l` listing with
# a list of pinned versions, and report every package that does not match.

listing="$1"   # saved dpkg -l output, for example: data/dpkg-l.txt
wanted="$2"    # pinned "NAME VERSION" lines, for example: data/wanted.txt
problems=0

# YOUR CODE: read "$wanted" line by line (skip blank lines and comments, keep
# a last line without a newline). For each name, find the version of the
# installed (ii) row with exactly that name in "$listing", print the matching
# report line, and count the problems.

echo "problems: $problems"

# YOUR CODE: exit with status 1 when there were problems.
