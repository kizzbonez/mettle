#!/usr/bin/env bash
# Usage: bash solution.sh EVENTS
# EVENTS lines: DATE TIME ZONE HOST MESSAGE, in the local time of each server.
# Prints "YYYY-MM-DDTHH:MM:SSZ HOST MESSAGE" for every event, sorted by UTC time.
set -u

events=$1

# For each event: skip empty lines and comments, convert the local time in $zone to UTC,
# and print the line. Then sort all lines by time, keeping the file order of equal times.
while read -r day time zone host message; do
  # YOUR CODE
  :
done < "$events"
