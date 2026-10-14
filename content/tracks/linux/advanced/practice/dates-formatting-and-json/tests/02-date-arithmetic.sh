cat > leap.json <<'EOF'
[
  {"title": "Leap Day", "member": "kai", "due": "2024-02-28"},
  {"title": "New Year", "member": "mo", "due": "2023-12-31", "returned": false},
  {"title": "Last Year", "member": "rita", "due": "2023-03-01"},
  {"title": "Feb 29", "member": "ole", "due": "2024-02-29"},
  {"title": "Same Day", "member": "pat", "due": "2024-03-01"},
  {"title": "Future", "member": "ula", "due": "2025-01-01"}
]
EOF
out=$(bash solution.sh leap.json 2024-03-01 2> err2.txt)
assert_eq "$?" "0" "exit status for loans around a leap day"
assert_eq "$out" "MEMBER     DUE         DAYS  TITLE
kai        28 Feb 2024    2  Leap Day
mo         31 Dec 2023   61  New Year
rita       01 Mar 2023  366  Last Year
ole        29 Feb 2024    1  Feb 29
4 overdue" "days overdue across a leap day, a year end and a whole leap year, on 2024-03-01"

# London moves its clocks forward on 2026-03-29, a day of 23 hours.
cat > dst.json <<'EOF'
[
  {"title": "Spring", "member": "eve", "due": "2026-03-28"},
  {"title": "Short Night", "member": "finn", "due": "2026-03-29"}
]
EOF
out=$(TZ=Europe/London bash solution.sh dst.json 2026-03-30 2> err2.txt)
assert_eq "$?" "0" "exit status with TZ=Europe/London"
assert_eq "$out" "MEMBER     DUE         DAYS  TITLE
eve        28 Mar 2026    2  Spring
finn       29 Mar 2026    1  Short Night
2 overdue" "days overdue across the change to summer time, with TZ=Europe/London"
