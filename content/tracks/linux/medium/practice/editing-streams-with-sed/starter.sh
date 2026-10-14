#!/usr/bin/env bash
# Usage: bash solution.sh FILE
#
# Migrate a screen's settings file in place, keeping FILE.bak: https for
# the *url settings, ISO dates for expires, no comments or empty lines.

file="$1"   # the settings file to change, for example: lobby.conf

# YOUR CODE: one sed command that edits "$file" in place with the backup
# suffix .bak and applies, in order:
#   - on lines whose name ends in url: every http:// becomes https://
#   - on lines whose name is expires: DD/MM/YYYY becomes YYYY-MM-DD
#   - comment lines (first character #) and empty lines are deleted
