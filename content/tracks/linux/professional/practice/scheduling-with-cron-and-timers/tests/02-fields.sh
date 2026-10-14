cat > fields.cron <<'EOF'
*/35 * * * *         /usr/local/bin/sync-podcasts
0,30 8-10,14 * * *   /usr/local/bin/news-ticker
5 8 * * *            /usr/local/bin/morning-check
0 12 */2 */3 *       /usr/local/bin/archive-odd-days
59 23 31 12 *        /usr/local/bin/year-end-report
EOF

assert_eq "$(bash solution.sh fields.cron "2026-10-14 08:35")" "/usr/local/bin/sync-podcasts" \
  "a minute step that does not divide the hour"
assert_eq "$(bash solution.sh fields.cron "2026-10-14 09:10")" "" \
  "a minute step does not carry over into the next hour"
assert_eq "$(bash solution.sh fields.cron "2026-10-14 14:30")" "/usr/local/bin/news-ticker" \
  "lists that mix single values and ranges"
assert_eq "$(bash solution.sh fields.cron "2026-10-14 08:05")" "/usr/local/bin/morning-check" \
  "a time whose hour and minute have leading zeros"
assert_eq "$(bash solution.sh fields.cron "2026-10-13 12:00")" "/usr/local/bin/sync-podcasts
/usr/local/bin/archive-odd-days" "steps in the day-of-month and month fields count from 1"
assert_eq "$(bash solution.sh fields.cron "2026-10-14 12:00")" "/usr/local/bin/sync-podcasts" \
  "a day of month that the step skips"
assert_eq "$(bash solution.sh fields.cron "2026-12-31 23:59")" "/usr/local/bin/year-end-report" \
  "the last minute of the year"
