cat > t3-canaries.txt <<'EOF'
# decoy accounts, reviewed 2026-09-01

svc-backup-old
#retired-decoy
pos-admin-2019
EOF
cat > t3-auth.log <<'EOF'
<86>1 2026-10-15T08:00:01.000Z bastion-02 sshd 6001 - - Failed password for invalid user pos-admin-2019 from 203.0.113.99 port 41001 ssh2
<13>1 2026-10-15T08:00:05.000Z bastion-02 sshd 6002 - - Failed password for svc-backup-old from 203.0.113.98 port 41002 ssh2
<190>1 2026-10-15T08:00:09.000Z lab-sim-01 sshd 6003 - - Failed password for svc-backup-old from 192.0.2.10 port 41003 ssh2
<86>1 2026-10-15T08:00:12.000Z bastion-02 ssh-audit 6004 - - Failed password for svc-backup-old from 192.0.2.11 port 41004 ssh2
<86>1 2026-10-15T08:00:15.000Z bastion-02 sshd 6005 - - Connection closed by 203.0.113.99 port 41005 [preauth]
<86>1 2026-10-15T08:01:00.000Z bastion-02 sshd 6006 - - Failed password for groomer from 198.51.100.90 port 42001 ssh2
<38>1 2026-10-15T08:01:10.000Z bastion-02 sshd 6007 - - Failed password for patroller from 198.51.100.90 port 42002 ssh2
<132>1 2026-10-15T08:01:20.000Z bastion-02 sshd 6008 - - Failed password for snowmaker from 198.51.100.90 port 42003 ssh2
<38>1 2026-10-15T08:01:25.000Z bastion-02 sshd 6009 - - Accepted publickey for svc-backup-old from 10.44.9.9 port 42010 ssh2
<84>1 2026-10-15T08:01:30.000Z bastion-02 sshd 6010 - - Failed password for instructor from 198.51.100.90 port 42004 ssh2
<38>1 2026-10-15T08:02:00.000Z bastion-02 sshd 6011 - - Accepted password for retired-decoy from 10.44.9.10 port 42011 ssh2
<85>1 2026-10-15T08:02:30.000Z bastion-02 sshd 6012 - - Failed password for invalid user svc-backup-old from 198.51.100.91 port 42012 ssh2
EOF

actual=$(bash solution.sh t3-auth.log 3 10 t3-canaries.txt)
status=$?
assert_eq "$actual" "CANARY pos-admin-2019 from 203.0.113.99 at 2026-10-15T08:00:01.000Z
CANARY svc-backup-old from 10.44.9.9 at 2026-10-15T08:01:25.000Z
SPRAY 198.51.100.90 at 2026-10-15T08:01:30.000Z
CANARY svc-backup-old from 198.51.100.91 at 2026-10-15T08:02:30.000Z" \
  "only sshd lines with facility 4 or 10 count; canaries on failures and successes, comment lines skipped"
assert_eq "$status" "1" "exit status when there are alerts"
