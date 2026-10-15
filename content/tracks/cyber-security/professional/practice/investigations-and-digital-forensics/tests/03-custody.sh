printf '# nothing to hash in this check\n' > t3-manifest.sha256
cat > t3-custody.csv <<'EOF'
item,time,released_by,received_by,purpose,seal
EV-A,2026-10-14 08:00,-,D. Osei,collected,yes
EV-B,2026-10-14 08:05,K. Lund,D. Osei,collected,yes

EV-A,2026-10-14 08:00,D. Osei,L. Hart,legal review,yes
EV-A,2026-10-14 07:55,M. Price,L. Hart,photographs,No
EV-B,2026-10-14 09:00,D. Osei,F. Ruiz,imaging,
EV-A,2026-10-14 07:58,L. Hart,D. Osei,return to locker,yes
EOF

actual=$(bash solution.sh t3-manifest.sha256 t3-custody.csv)
status=$?
assert_eq "$actual" "BREAK EV-B at 2026-10-14 08:05: released by K. Lund, last held by -
ORDER EV-A at 2026-10-14 07:55
BREAK EV-A at 2026-10-14 07:55: released by M. Price, last held by L. Hart
SEAL EV-A at 2026-10-14 07:55
SEAL EV-B at 2026-10-14 09:00" \
  "mixed items, a first row not released by -, equal times, several problems in one row, and each row becoming the previous one"
assert_eq "$status" "1" "exit status when the chain of custody has gaps"
