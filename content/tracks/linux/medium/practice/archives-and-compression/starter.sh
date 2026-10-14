#!/usr/bin/env bash
# Usage: bash solution.sh FOLDER
#
# Pack FOLDER into FOLDER.tar.gz, write its checksum to FOLDER.tar.gz.sha256,
# and list the files inside the archive.

folder="$1"                   # the folder to deliver, for example: shoot
archive="$folder.tar.gz"      # the archive to create, for example: shoot.tar.gz

# YOUR CODE: create "$archive", a gzip-compressed tar of "$folder".

# YOUR CODE: save the checksum of "$archive" in "$archive.sha256".

# YOUR CODE: list the archive's members, leave out the folder entries
# (they end in /), and sort what is left.
