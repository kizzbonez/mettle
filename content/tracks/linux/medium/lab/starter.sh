#!/usr/bin/env bash
# Usage: bash solution.sh DIRECTORY
#
# Report the hours per project in the timesheets (*.csv) under DIRECTORY,
# most hours first, then the total and the number of rejected lines.
set -u

# "${1-}" is the first argument, or an empty string when none was given.
dir="${1-}"

# YOUR CODE: if "$dir" is empty or not a directory, print the usage message on
# standard error and exit with status 2.

# YOUR CODE: find every regular *.csv file under "$dir" (names may contain
# spaces) and read all of their lines.

# YOUR CODE: remove carriage returns, skip blank lines, comments and headers,
# check each record, and add up the hours per project (in lower case).

# YOUR CODE: print "<project> <hours>" lines (most hours first, ties by name),
# then "total <hours>" and "rejected <count>".
