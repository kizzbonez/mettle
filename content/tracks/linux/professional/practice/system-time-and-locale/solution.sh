#!/usr/bin/env bash
# Usage: bash solution.sh EVENTS
# EVENTS lines: DATE TIME ZONE HOST MESSAGE, in the local time of each server.
# Prints "YYYY-MM-DDTHH:MM:SSZ HOST MESSAGE" for every event, sorted by UTC time.
set -u

events=$1

# For each event: skip empty lines and comments, convert the local time in $zone to UTC,
# and print the line. Then sort all lines by time, keeping the file order of equal times.
while read -r day time zone host message; do
  case $day in
    '' | '#'*) continue ;;
  esac
  seconds=$(TZ=$zone date -d "$day $time" +%s)
  utc=$(date -u -d "@$seconds" '+%Y-%m-%dT%H:%M:%SZ')
  printf '%s %s %s\n' "$utc" "$host" "$message"
done < "$events" | LC_ALL=C sort -s -k1,1
