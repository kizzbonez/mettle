#!/usr/bin/env bash
# Timetable Links: one timetable file, several names for it.

# A hard link: a second name for the same inode. What exists comes first.
ln timetable-2026.txt timetable.txt

# The link lives in staff, so its target is read from there: one level up.
ln -s ../timetable-2026.txt staff/timetable.txt

# -f replaces an existing latest; -n treats a latest that points to a folder
# as a plain name, instead of putting the new link inside that folder.
ln -sfn term-2 latest

# readlink prints the target text stored in each link.
readlink staff/timetable.txt
readlink latest
