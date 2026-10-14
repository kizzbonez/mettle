#!/usr/bin/env bash
# Usage: bash solution.sh FILE TAG
file="$1"
tag="$2"

# The braces end the variable name: "$tag_" would be a variable called tag_.
copy="${tag}_$file"

cp "$file" "$copy"
status=$?   # saved at once: the next command replaces $?

# Reading from < makes wc print the number without a file name.
lines=$(wc -l < "$file")
words=$(wc -w < "$file")
echo "saved $copy: $lines lines, $words words"

# Without this, the script would end with echo's status, 0, even after a failed copy.
exit "$status"
