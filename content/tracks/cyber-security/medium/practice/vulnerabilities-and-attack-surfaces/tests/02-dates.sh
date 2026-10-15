cat > t2-inventory.csv <<'EOF'
host,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner
ends-today,Debian 11,2026-03-02,2026-03-01,yes,internal,22,ops
ended-yesterday,Debian 10,2026-03-01,2026-03-01,yes,internal,22,ops
patched-30,Debian 12,2028-06-30,2026-01-31,yes,internal,,ops
patched-31,Debian 12,2028-06-30,2026-01-30,yes,internal,,ops
patched-unknown,Debian 12,2028-06-30,unknown,yes,internal,,ops
os-unknown,unknown,unknown,2026-02-20,yes,internal,,ops
last-year,Debian 12,2028-06-30,2025-03-02,yes,internal,,ops
EOF

actual=$(bash solution.sh 2026-03-02 t2-inventory.csv)
assert_eq "$(sed -n 1p <<< "$actual")" "ended-yesterday: unsupported" \
  "support ending today is still supported; ending yesterday is not"
assert_eq "$(grep -c '^patched-30:' <<< "$actual")" "0" \
  "a patch exactly 30 days before TODAY, counted across the end of February, is not unpatched"
assert_eq "$actual" "ended-yesterday: unsupported
patched-31: unpatched
patched-unknown: unpatched
os-unknown: unknown-os
last-year: unpatched
5 of 7 hosts need action" "date checks around the end of February"
