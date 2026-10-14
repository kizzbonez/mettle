#!/usr/bin/env bash
# Evening Class Cheat Sheet: every answer comes from the system's own help.

echo "== Kinds =="
# help type: -t prints a single word for each name.
type -t cd date if

echo "== pwd =="
# help help: -s prints only the short usage synopsis.
help -s pwd

echo "== Weekdays =="
# date --help: -d shows the date described by its argument instead of now.
date -d 2026-12-25 +%A
date -d 2026-12-31 +%A
