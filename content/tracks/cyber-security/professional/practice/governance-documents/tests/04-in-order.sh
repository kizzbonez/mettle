cat > t4-documents.csv <<'EOF'
id,title,type,owner,approver,approved,review_months
POL-301,Access Control Policy,policy,CISO,Board,2026-04-01,12

STD-302,Encryption Standard,standard,Security Architect,CISO,2026-02-10,12
RB-303,Password Spraying Runbook,procedure,SOC Lead,CISO,2026-09-01,6
EOF

actual=$(bash solution.sh t4-documents.csv 2026-10-16)
status=$?
assert_eq "$actual" "register in order" "a register that meets every rule"
assert_eq "$status" "0" "exit status when nothing was found"

printf 'id,title,type,owner,approver,approved,review_months\n' > t4-empty.csv
actual=$(bash solution.sh t4-empty.csv 2026-10-16)
status=$?
assert_eq "$actual" "register in order" "a register with only its header"
assert_eq "$status" "0" "exit status for an empty register"
