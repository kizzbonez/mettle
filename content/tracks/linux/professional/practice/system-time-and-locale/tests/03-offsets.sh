cat > world.txt <<'EOF'
2026-10-15 03:30:00 Asia/Manila web-mnl nightly cleanup started
2026-10-14 23:45:00 America/New_York pay-nyc settlement batch closed
2026-10-14 14:30:00 Asia/Kolkata support-blr ticket 5521 opened
2026-10-14 19:30:00 Australia/Adelaide edge-adl cache purge
2027-01-01 07:00:00 Asia/Manila web-mnl new year banner enabled
2026-12-31 18:30:00 America/New_York pay-nyc year-end freeze started
EOF
assert_eq "$(bash solution.sh world.txt)" "2026-10-14T09:00:00Z support-blr ticket 5521 opened
2026-10-14T09:00:00Z edge-adl cache purge
2026-10-14T19:30:00Z web-mnl nightly cleanup started
2026-10-15T03:45:00Z pay-nyc settlement batch closed
2026-12-31T23:00:00Z web-mnl new year banner enabled
2026-12-31T23:30:00Z pay-nyc year-end freeze started" \
  "half-hour offsets, and local times whose UTC date is a different day or year"
