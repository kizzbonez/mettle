#!/usr/bin/env bash
# Usage: bash solution.sh FILE
#
# Print the three most borrowed titles in a loans export, with their counts.

file="$1"   # the loans export, for example: data/loans.csv

# YOUR CODE: one pipeline that skips the header line, takes the title field,
# removes carriage returns, lower-cases the titles, counts them and prints the
# top three (most loans first, ties in alphabetical order).
