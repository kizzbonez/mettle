cat > t2-documents.csv <<'EOF'
id,title,type,owner,approver,approved,review_months
POL-101,Clean Desk Policy,POLICY,Facilities Manager,Executive Committee,2026-06-01,12
POL-102,Privacy Policy,Policy,Data Protection Officer,Data Protection Officer,2026-06-01,12

STD-103,Physical Security Standard,Standard,Facilities Manager,CISO,2026-06-01,12
PRO-104,Leaver Offboarding Procedure,procedure,IT Service Desk,IT Service Desk,2026-06-01,12
POL-105,Incident Response Policy,policy,,,2026-06-01,12
PLN-106,Business Continuity Plan,Plan,COO,,2026-06-01,12
GDL-107,Zero Trust Reference Architecture,guideline,Security Architect,Board,2026-06-01,24
EOF

actual=$(bash solution.sh t2-documents.csv 2026-10-16)
status=$?
assert_eq "$actual" "WRONG-APPROVER POL-102 (Data Protection Officer)
NO-OWNER POL-105
UNAPPROVED POL-105
UNAPPROVED PLN-106" \
  "owners and approvers: types in any case, who may approve a policy, and other types with any approver"
assert_eq "$status" "1" "exit status when there are findings"
