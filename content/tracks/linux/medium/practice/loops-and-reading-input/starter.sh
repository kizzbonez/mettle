#!/usr/bin/env bash
# Usage: bash solution.sh FILE
#
# Read a pantry list and print what to buy: "buy ITEM: N" for every item below
# its minimum, then "total: T".

file="$1"   # the pantry list, for example: data/pantry.csv
total=0

# YOUR CODE: a while read loop over "$file" that splits each line into item,
# stock and minimum, skips empty lines and comments, stops at END, prints
# "buy ITEM: N" when stock is lower than minimum and adds N to total.

echo "total: $total"
