#!/usr/bin/env bash
# Usage: bash solution.sh FOLDER
folder="$1"
archive="$folder.tar.gz"

# -c creates, -z compresses with gzip, -f names the archive. Naming the folder
# itself stores every member as FOLDER/..., hidden files and empty folders too.
tar -czf "$archive" "$folder"

# sha256sum writes "CHECKSUM  NAME" with the name as given, a relative name
# here, so sha256sum -c finds the archive from the current directory.
sha256sum "$archive" > "$archive.sha256"

# -t lists the members; folder entries end in /, so grep -v drops them.
tar -tzf "$archive" | grep -v '/$' | sort
