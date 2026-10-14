cat > days.cron <<'EOF'
0 12 13 * 5      /usr/local/bin/friday-or-13th
0 12 13 * *      /usr/local/bin/on-the-13th
0 12 * * 5       /usr/local/bin/every-friday
0 12 */2 * 5     /usr/local/bin/odd-friday
30 18 * * 7      /usr/local/bin/sunday-seven
30 18 * * 0      /usr/local/bin/sunday-zero
30 18 * * 5-7    /usr/local/bin/friday-to-sunday
EOF

assert_eq "$(bash solution.sh days.cron "2026-10-13 12:00")" "/usr/local/bin/friday-or-13th
/usr/local/bin/on-the-13th" "Tuesday the 13th, with both day fields restricted"
assert_eq "$(bash solution.sh days.cron "2026-10-16 12:00")" "/usr/local/bin/friday-or-13th
/usr/local/bin/every-friday" "Friday the 16th, with both day fields restricted"
assert_eq "$(bash solution.sh days.cron "2026-10-09 12:00")" "/usr/local/bin/friday-or-13th
/usr/local/bin/every-friday
/usr/local/bin/odd-friday" "Friday the 9th, with a day-of-month field that starts with *"
assert_eq "$(bash solution.sh days.cron "2026-10-07 12:00")" "" \
  "a day-of-month field that starts with * needs the day of week to match too"
assert_eq "$(bash solution.sh days.cron "2026-10-18 18:30")" "/usr/local/bin/sunday-seven
/usr/local/bin/sunday-zero
/usr/local/bin/friday-to-sunday" "Sunday written as 7, as 0, and at the end of a range"
assert_eq "$(bash solution.sh days.cron "2026-10-17 18:30")" "/usr/local/bin/friday-to-sunday" \
  "a Saturday"
