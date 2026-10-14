#!/usr/bin/env bash
# Usage: bash solution.sh <upload-folder> <release-folder>
#
# Package one data-logger upload into a tidy release folder: readings, logs and
# notes copied by name, read-only data, a private logs folder, a README.txt link
# and a four-line summary. The instructions give every rule and the exact output.
set -u

upload="$1"     # the folder the logger uploaded, for example: data
release="$2"    # the release folder to create, for example: release-week41

# YOUR CODE 1: create "$release" with the subfolders readings, logs and notes.

# YOUR CODE 2: copy the .csv, .log and .txt files from the top of "$upload".

# YOUR CODE 3: make the files in readings and notes read-only (444),
#              and the logs folder private (700).

# YOUR CODE 4: create the symbolic link "$release/README.txt" -> notes/README.txt

# YOUR CODE 5: count the files and the ERROR lines, print the four summary
#              lines and save the same lines in "$release/SUMMARY.txt".
