#!/usr/bin/env bash
# Usage: bash solution.sh DIR
#
# Sweep a render cache: delete stale .tmp files and empty files, list what
# was deleted, then count the ERROR lines in the .log files.

dir="$1"   # the folder to sweep, for example: farm

# YOUR CODE: one find command that deletes every regular file below "$dir"
# that is (named *.tmp and older than 7 days) or empty, prints the path of
# each one, and pipes the paths through sort.

# YOUR CODE: find every *.log file below "$dir", hand the names safely to
# xargs and grep, count the ERROR lines and print "errors: N".
