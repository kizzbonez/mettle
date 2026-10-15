cat > t3-inventory.csv <<'EOF'
host,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner
lookalikes,Debian 12,2028-06-30,2026-10-10,yes,internet,2222 33890 220 5901 23456 8022,web
reversed,Debian 12,2028-06-30,2026-10-10,yes,internet,5900  3389 23    22,web
internal-all,Debian 12,2028-06-30,2026-10-10,yes,internal,22 23 3389 5900,web
dmz-telnet,Debian 12,2028-06-30,2026-10-10,yes,dmz,23,web
no-ports,Debian 12,2028-06-30,2026-10-10,yes,internet,,web
single-rdp,Windows Server 2022,2031-10-14,2026-10-10,yes,internet,3389,web
EOF

actual=$(bash solution.sh 2026-10-16 t3-inventory.csv)
status=$?
assert_eq "$(grep -c '^lookalikes:' <<< "$actual")" "0" \
  "ports such as 2222, 33890, 220 and 5901 are not management ports"
assert_eq "$actual" "reversed: exposed:22 exposed:23 exposed:3389 exposed:5900
single-rdp: exposed:3389
2 of 6 hosts need action" \
  "management ports on internet-facing hosts only, in ascending order, with extra spaces between ports"
assert_eq "$status" "1" "exit status when hosts need action"
