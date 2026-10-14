#!/usr/bin/env bash
# Pool Desk Report: a quick look at the bookings log and the mystery poster.

echo "== header =="
head -n 1 bookings.log

echo "== latest =="
tail -n 3 bookings.log

echo "== count =="
# -l counts only the lines (strictly, the newline characters).
wc -l bookings.log

echo "== poster =="
# file looks at the content, not at the name.
file poster.png
