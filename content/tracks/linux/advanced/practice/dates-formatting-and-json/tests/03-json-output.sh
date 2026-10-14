cat > quoted.json <<'EOF'
[
  {"title": "Say \"Cheese\": A Photo Guide", "member": "li wei", "due": "2026-05-01", "returned": false},
  {"title": "Returned Book", "member": "zoe", "due": "2026-04-01", "returned": true},
  {"title": "Café & Croissants for $5", "member": "nora k", "due": "2026-05-09"}
]
EOF

out=$(bash solution.sh quoted.json 2026-05-10 2> err3.txt)
assert_eq "$?" "0" "exit status for titles with quotes and members with spaces"
assert_eq "$out" 'MEMBER     DUE         DAYS  TITLE
li wei     01 May 2026    9  Say "Cheese": A Photo Guide
nora k     09 May 2026    1  Café & Croissants for $5
2 overdue' "the table for titles with quotes and members with spaces"

assert_eq "$(wc -l < overdue.jsonl)" "2" "overdue.jsonl holds one line per overdue loan"
normalised=$(jq -cS . overdue.jsonl 2> /dev/null) \
  || fail "every line of overdue.jsonl is valid JSON, even for a title with double quotes"
assert_eq "$normalised" '{"days":9,"member":"li wei","title":"Say \"Cheese\": A Photo Guide"}
{"days":1,"member":"nora k","title":"Café & Croissants for $5"}' \
  "the objects in overdue.jsonl, with days as a number"

# A day on which nothing is overdue: the file from the run above must be replaced.
out=$(bash solution.sh quoted.json 2026-04-15 2> err3.txt)
assert_eq "$?" "0" "exit status when nothing is overdue"
assert_eq "$out" "MEMBER     DUE         DAYS  TITLE
0 overdue" "the table when nothing is overdue"
[[ -f overdue.jsonl ]] || fail "overdue.jsonl is written even when nothing is overdue"
assert_eq "$(cat overdue.jsonl)" "" "overdue.jsonl is empty when nothing is overdue"
