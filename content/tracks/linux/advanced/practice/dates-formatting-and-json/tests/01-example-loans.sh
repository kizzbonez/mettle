out=$(bash solution.sh data/loans.json 2026-10-14 2> err1.txt)
assert_eq "$?" "0" "exit status for data/loans.json on 2026-10-14"
assert_eq "$out" "MEMBER     DUE         DAYS  TITLE
ana        01 Oct 2026   13  The Left Hand of Darkness
joe        13 Oct 2026    1  Piranesi
2 overdue" "the table printed for data/loans.json on 2026-10-14"
[[ -f overdue.jsonl ]] || fail "overdue.jsonl is written in the current directory"
assert_eq "$(cat overdue.jsonl)" '{"member":"ana","title":"The Left Hand of Darkness","days":13}
{"member":"joe","title":"Piranesi","days":1}' "the JSON lines written to overdue.jsonl"
