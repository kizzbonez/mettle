#!/usr/bin/env bash
# Newsletter Wrap-Up: archive the month's files and tidy the folder.

# -p creates archive too when it is missing, and does not mind 2026 existing.
mkdir -p archive/2026

# The destination is a folder, so the copy goes inside it and keeps its name.
cp letters.txt archive/2026/

# -r copies a folder and everything in it. With archive as the destination,
# the copy is always archive/templates, even when that exists already.
cp -r templates archive/

# Renaming is a move to a new name.
mv draft.txt issue-12.txt

# rmdir removes a folder only when it is empty, which proves it was.
rm scratch.txt
rmdir old
