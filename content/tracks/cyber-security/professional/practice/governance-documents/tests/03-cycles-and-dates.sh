cat > t3-documents.csv <<'EOF'
id,title,type,owner,approver,approved,review_months
GDL-201,Benchmark Adoption Guideline,guideline,CISO,CISO,2025-01-05,24
GDL-202,Advisory Handling Guideline,Guideline,CISO,CISO,2025-01-04,25
POL-203,Vulnerability Disclosure Policy,policy,CISO,Board,2026-01-04,12
STD-204,Baseline Configuration Standard,standard,Infrastructure,CISO,2025-12-10,13
PRO-205,Backup Verification Procedure,procedure,Infrastructure,Head of IT,2026-07-05,6
PLN-206,Incident Response Plan,plan,CISO,CISO,2026-06-30,6
EOF

actual=$(bash solution.sh t3-documents.csv 2027-01-05)
status=$?
assert_eq "$actual" "CYCLE GDL-202 (25 months)
OVERDUE POL-203 (due 2027-01-04)
CYCLE STD-204 (13 months)
OVERDUE PLN-206 (due 2026-12-30)" \
  "review cycles for guidelines and other types, and due dates before, on and after AS_OF 2027-01-05"
assert_eq "$status" "1" "exit status when there are findings"
