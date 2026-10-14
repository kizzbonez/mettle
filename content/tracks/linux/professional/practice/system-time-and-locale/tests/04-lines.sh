cat > utc-servers.txt <<'EOF'
# web01 and db01 run in UTC

2026-10-14 09:15:00 UTC web01 nginx: "OPTIONS * HTTP/1.1" 405
#2026-10-14 09:00:00 UTC web01 an event that was commented out

2026-10-14 09:10:00 UTC db01 backup: copied   3 files to s3://archive/db01/
EOF
assert_eq "$(bash solution.sh utc-servers.txt)" '2026-10-14T09:10:00Z db01 backup: copied   3 files to s3://archive/db01/
2026-10-14T09:15:00Z web01 nginx: "OPTIONS * HTTP/1.1" 405' \
  "comments, empty lines, and messages with quotes, a * and repeated spaces"

: > none.txt
assert_eq "$(bash solution.sh none.txt)" "" "a file with no events"
