#!/usr/bin/env bash
# Opening Checklist
#
# Bash runs this script from top to bottom, one line at a time, as if you
# typed each line at the prompt. The tests run it with
#
#     bash solution.sh
#
# Before each run they install two small check programs, oven-check and
# till-check. Neither prints anything: each one only finishes with an exit
# status, 0 when all is well and another number when something needs doing.
# Every test sets them up differently, so your lines must work in all cases.

echo "Opening checklist"

# Run oven-check, then print its exit status, which $? holds.
oven-check
echo "oven status: $?"

# YOUR CODE: write the two lines from the instructions here, the oven line
# first, then the till line. Each one joins two commands with && or ||.

echo "Checklist done"
