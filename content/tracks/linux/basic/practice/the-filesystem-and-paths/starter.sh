#!/usr/bin/env bash
# Prop Store Tour
#
# The tests build a small store of folders, go into a folder two levels
# below the top of the store, and run this script from there with
#
#     bash solution.sh
#
# So the working directory is that folder, and relative paths start from it.
# Every test builds a different store with different names, so reach the
# other folders with relative paths such as .. and never type their names.

echo "== here =="
# YOUR CODE (task 1): list everything in the working directory, hidden
# names included, but not . and ..

echo "== one level up =="
# YOUR CODE (task 2): list the parent directory, with / after folder names.

echo "== top =="
# YOUR CODE (task 3): go up two levels with cd, print the absolute path of
# where you are now, then list that folder with / after folder names.
