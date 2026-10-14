#!/usr/bin/env bash
# takes: suggest a tidy name for every recorded take in a list, and count them by type.
# Run as: [PREFIX=TEXT] bash solution.sh LIST

# YOUR CODE: take LIST from $1, and stop with "usage: solution.sh LIST" when it is
# missing or empty (one parameter expansion does both).
list=$1

# YOUR CODE: read every line of LIST into an indexed array.

# YOUR CODE: declare an associative array that counts the files of each extension.

# YOUR CODE: for every path in the array (skip empty lines):
#   - split off the name, the stem and the extension with parameter expansion,
#   - build the new name, with PREFIX in front when it is set and not empty,
#   - print "NAME -> NEW NAME" and count the extension.

# YOUR CODE: print one "EXT: COUNT" line per extension, sorted with sort.
