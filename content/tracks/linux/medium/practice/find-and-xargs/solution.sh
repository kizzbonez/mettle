#!/usr/bin/env bash
# Usage: bash solution.sh DIR
dir="$1"

# -type f applies to both halves of the -o because of the parentheses, so
# empty directories are never chosen. -print comes before -delete so that
# each path is printed, and both come after the tests.
find "$dir" -type f \( -name '*.tmp' -mtime +7 -o -empty \) -print -delete | sort

# -print0 and xargs -0 keep names with spaces whole. grep prints one line per
# match (with the file name in front when it reads several files), so wc -l
# counts the matches either way.
errors=$(find "$dir" -type f -name '*.log' -print0 | xargs -0 grep ERROR | wc -l)
echo "errors: $errors"
