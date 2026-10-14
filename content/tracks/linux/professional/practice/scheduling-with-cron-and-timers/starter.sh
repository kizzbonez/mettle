#!/usr/bin/env bash
# Usage: bash solution.sh CRONTAB "YYYY-MM-DD HH:MM"
# Prints the command of every job in CRONTAB that cron starts at that minute, in file order.
set -u

crontab=$1
when=$2

# The time as five numbers: minute, hour, day of month, month, day of week (0 = Sunday).
# date prints them with leading zeros, such as 08.
read -r minute hour dom month dow <<< "$(date -d "$when" '+%M %H %d %m %w')"

# For every job line (first non-blank character a digit or *), print its command when the
# job runs at that minute. The instructions give the rules for the fields and the two day fields.
# YOUR CODE
