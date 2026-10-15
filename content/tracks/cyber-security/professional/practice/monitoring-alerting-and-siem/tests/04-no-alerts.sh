cat > t4-canaries.txt <<'EOF'
# canary accounts
svc-backup-old
EOF
cat > t4-auth.log <<'EOF'
<38>1 2026-10-16T07:00:00.000Z bastion-01 sshd 7001 - - Accepted publickey for deploy from 10.44.8.15 port 50001 ssh2
<86>1 2026-10-16T07:05:00.000Z bastion-01 sshd 7002 - - Failed password for lift-ops from 198.51.100.7 port 50002 ssh2
<86>1 2026-10-16T07:06:00.000Z bastion-01 sshd 7003 - - Failed password for ticketing from 198.51.100.7 port 50003 ssh2
<86>1 2026-10-16T07:20:00.000Z bastion-01 sshd 7004 - - Failed password for rental-a from 198.51.100.7 port 50004 ssh2
<190>1 2026-10-16T07:21:00.000Z lab-sim-01 sshd 7005 - - Failed password for svc-backup-old from 198.51.100.7 port 50005 ssh2
EOF

actual=$(bash solution.sh t4-auth.log 3 10 t4-canaries.txt)
status=$?
assert_eq "$actual" "no alerts" "a log with failures spread beyond the window and a canary only on an ignored facility"
assert_eq "$status" "0" "exit status when there are no alerts"

: > t4-empty.log
actual=$(bash solution.sh t4-empty.log 3 10 t4-canaries.txt)
status=$?
assert_eq "$actual" "no alerts" "an empty log"
assert_eq "$status" "0" "exit status for an empty log"
