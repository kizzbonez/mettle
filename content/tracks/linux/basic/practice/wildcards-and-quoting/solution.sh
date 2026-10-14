#!/usr/bin/env bash
# Podcast Session Sort: sort a recording folder with patterns and quotes.

# Braces generate two words: episode/takes episode/notes.
mkdir -p episode/{takes,notes}

# ? is exactly one character, so take-10.wav and above do not match.
cp take-?.wav episode/takes/

# * skips hidden names, and each match stays one word even with spaces in it.
cp *.txt episode/notes/

# Quotes keep the space inside the name, so rm receives a single argument.
rm "rough cut.wav"

# Single quotes keep everything as typed: the double quotes, & and *.
echo 'Next week: "Rivers & Bridges" at 8:00, *live*'
