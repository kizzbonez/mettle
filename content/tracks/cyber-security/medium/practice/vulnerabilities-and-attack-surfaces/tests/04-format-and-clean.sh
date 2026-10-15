printf '# exported from the spreadsheet\r\n\r\nhost,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner\r\nspa-tablet,iPadOS 18,2027-09-01,2026-10-12,no,internal,,spa\r\n# retired kiosks below\r\nbar-pos,Windows 11 IoT Enterprise LTSC 2024,2034-10-10,2026-10-15,yes,internet,443 22,\r\n' > t4-crlf.csv
actual=$(bash solution.sh 2026-10-16 t4-crlf.csv)
status=$?
assert_eq "$actual" "spa-tablet: unmanaged
bar-pos: exposed:22 no-owner
2 of 2 hosts need action" "Windows line endings, comments and a blank line in the middle of the file"
assert_eq "$status" "1" "exit status when hosts need action"

cat > t4-clean.csv <<'EOF'
host,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner
web-a,Debian 12,2028-06-30,2026-10-01,yes,internet,80 443,digital

web-b,Debian 12,2028-06-30,2026-09-20,yes,internet,443,digital
EOF
actual=$(bash solution.sh 2026-10-16 t4-clean.csv)
status=$?
assert_eq "$actual" "0 of 2 hosts need action" "an inventory where no host needs action"
assert_eq "$status" "0" "exit status when no host needs action"

printf 'host,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner\n' > t4-empty.csv
actual=$(bash solution.sh 2026-10-16 t4-empty.csv)
status=$?
assert_eq "$actual" "0 of 0 hosts need action" "an inventory with only the header"
assert_eq "$status" "0" "exit status for an empty inventory"
