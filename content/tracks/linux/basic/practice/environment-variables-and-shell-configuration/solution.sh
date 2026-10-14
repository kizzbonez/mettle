#!/usr/bin/env bash
# Race Day Badges: hand the badge program the runner's details.

# Double quotes keep the name exactly as given, spaces and all.
echo "Runner: $1"
echo "Bib: $2"

# export copies the variables into the environment of every program started
# from here on, so badge can read them.
export RUNNER="$1"
export BIB="$2"

# In front of the old list, so this badge wins over any other of that name;
# keeping :$PATH means every other command is still found.
PATH="$PWD/tools:$PATH"
badge

# $( ) puts the command's output into the line; with < wc prints no file name.
echo "Badges printed today: $(wc -l < badges.log)"
