#!/usr/bin/env bash
# Usage: bash solution.sh <upload-folder> <release-folder>
set -u

upload="$1"
release="$2"

# 1. -p creates any missing parents and does not mind a folder that exists.
mkdir -p "$release/readings" "$release/logs" "$release/notes"

# 2. The variables are quoted because the paths may contain spaces; the wildcards
#    stay outside the quotes so the shell expands them. "*" skips hidden files and
#    does not descend into subfolders. When a kind of file is missing, the pattern
#    reaches cp unexpanded and cp's complaint about it is thrown away.
cp "$upload"/*.csv "$release/readings/" 2> /dev/null
cp "$upload"/*.log "$release/logs/" 2> /dev/null
cp "$upload"/*.txt "$release/notes/" 2> /dev/null

# 3. Read-only data and notes, and a logs folder only the owner can enter.
chmod 444 "$release"/readings/* "$release"/notes/* 2> /dev/null
chmod 700 "$release/logs"

# 4. The target is read from the link's own folder, so a relative target keeps
#    working wherever the release folder is moved.
ln -s notes/README.txt "$release/README.txt"

# 5. ls writes one name per line into a pipe, so wc -l counts the files. grep
#    prefixes file names when it reads several files, but still prints one line
#    per match, which is all wc -l needs.
readings=$(ls "$release/readings" | wc -l)
logs=$(ls "$release/logs" | wc -l)
notes=$(ls "$release/notes" | wc -l)
errors=$(grep ERROR "$release"/logs/* 2> /dev/null | wc -l)

summary="$release/SUMMARY.txt"
echo "readings: $readings" > "$summary"
echo "logs: $logs" >> "$summary"
echo "notes: $notes" >> "$summary"
echo "errors: $errors" >> "$summary"
cat "$summary"
