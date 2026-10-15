actual=$(bash solution.sh data/documents.csv 2026-10-16)
status=$?
assert_eq "$actual" "OVERDUE POL-004 (due 2026-09-02)
WRONG-APPROVER POL-007 (CISO)
CYCLE STD-012 (36 months)
OVERDUE STD-012 (due 2026-06-01)
NO-OWNER PRO-031
OVERDUE GDL-002 (due 2026-10-15)
UNAPPROVED PLN-003" "findings for data/documents.csv on 2026-10-16"
assert_eq "$status" "1" "exit status when there are findings"
