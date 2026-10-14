#!/usr/bin/env bash
# Lunch Order Tally: sort, count, note and check the day's orders.

# > creates sorted.txt, or empties it first when it exists.
sort orders.txt > sorted.txt

# With <, wc never learns the file's name, so it prints only the number.
wc -l < orders.txt

# tee writes the three lines to first.txt and passes them on to the screen.
sort orders.txt | head -n 3 | tee first.txt

# >> appends, keeping what kitchen.log already holds.
echo "tally done" >> kitchen.log

# When extras.txt is missing, cat's complaint goes to /dev/null.
cat extras.txt 2> /dev/null
