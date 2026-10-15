mkdir -p t4-evidence
printf 'disk image of workstation WS-CM-12\n' > t4-evidence/ws-cm-12.img
printf 'cloud mailbox export for j.lindqvist\n' > t4-evidence/mailbox.pst
cat > t4-manifest.sha256 <<'EOF'
c159c0815dc74586c0ebacbd9256b1859dc8158acf5b7541eb472496b3b5ddfd  t4-evidence/ws-cm-12.img
e4e425bab5ae3c44ba851195028ffe4fb5e4f735a15ad6ec395567a153c9ea42  t4-evidence/mailbox.pst
EOF
cat > t4-custody.csv <<'EOF'
item,time,released_by,received_by,purpose,seal
EV-W,2026-10-15 11:00,-,D. Osei,collected,yes
EV-M,2026-10-15 11:20,-,D. Osei,collected,yes
EV-W,2026-10-15 13:45,D. Osei,F. Ruiz,analysis,yes
EV-W,2026-10-16 09:00,F. Ruiz,D. Osei,return to locker,yes
EOF

actual=$(bash solution.sh t4-manifest.sha256 t4-custody.csv)
status=$?
assert_eq "$actual" "VERIFIED t4-evidence/ws-cm-12.img
VERIFIED t4-evidence/mailbox.pst" "verified evidence with an intact chain of custody"
assert_eq "$status" "0" "exit status when everything is verified and intact"

printf '# no evidence yet\n' > t4-empty-manifest.sha256
printf 'item,time,released_by,received_by,purpose,seal\n' > t4-empty-custody.csv
actual=$(bash solution.sh t4-empty-manifest.sha256 t4-empty-custody.csv)
status=$?
assert_eq "$actual" "" "a manifest with only a comment and a custody file with only its header print nothing"
assert_eq "$status" "0" "exit status for empty files"
