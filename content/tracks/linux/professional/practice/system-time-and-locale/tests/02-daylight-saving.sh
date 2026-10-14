cat > spring.txt <<'EOF'
2026-03-09 00:30:00 America/New_York pay-nyc after the change
2026-03-07 23:30:00 America/New_York pay-nyc before the change
2026-03-08 04:30:00 UTC monitor-ams check ok
2026-03-30 12:00:00 Europe/London db-lon summer time
2026-03-28 12:00:00 Europe/London db-lon winter time
2026-10-26 09:00:00 Europe/London db-lon back to winter time
EOF
assert_eq "$(bash solution.sh spring.txt)" "2026-03-08T04:30:00Z pay-nyc before the change
2026-03-08T04:30:00Z monitor-ams check ok
2026-03-09T04:30:00Z pay-nyc after the change
2026-03-28T12:00:00Z db-lon winter time
2026-03-30T11:00:00Z db-lon summer time
2026-10-26T09:00:00Z db-lon back to winter time" \
  "local times on both sides of the daylight saving changes in New York and London"
