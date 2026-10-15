printf '# no canaries on this host\n' > t2-canaries.txt
cat > t2-auth.log <<'EOF'
<86>1 2026-10-14T02:00:00.500Z bastion-02 sshd 5001 - - Failed password for rental-a from 203.0.113.60 port 40001 ssh2
<86>1 2026-10-14T02:01:10.000Z bastion-02 sshd 5002 - - Failed password for p.novak from 192.0.2.44 port 51001 ssh2
<86>1 2026-10-14T02:02:00.000Z bastion-02 sshd 5003 - - Failed password for rental-b from 203.0.113.60 port 40002 ssh2
<86>1 2026-10-14T02:02:15.000Z bastion-02 sshd 5004 - - Failed password for k.ito from 198.51.100.80 port 33001 ssh2
<86>1 2026-10-14T02:02:20.000Z bastion-02 sshd 5005 - - Failed password for k.ito from 198.51.100.80 port 33002 ssh2
<86>1 2026-10-14T02:02:25.000Z bastion-02 sshd 5006 - - Failed password for k.ito from 198.51.100.80 port 33003 ssh2
<86>1 2026-10-14T02:02:30.000Z bastion-02 sshd 5007 - - Failed password for k.ito from 198.51.100.80 port 33004 ssh2
<86>1 2026-10-14T02:03:05.000Z bastion-02 sshd 5008 - - Failed password for invalid user test from 192.0.2.44 port 51002 ssh2
<86>1 2026-10-14T02:03:30.250Z bastion-02 sshd 5009 - - Failed password for lift-ops from 192.0.2.44 port 51003 ssh2
<86>1 2026-10-14T02:04:00.000Z bastion-02 sshd 5010 - - Failed password for rental-c from 192.0.2.44 port 51004 ssh2
<86>1 2026-10-14T02:05:01.000Z bastion-02 sshd 5011 - - Failed password for rental-c from 203.0.113.60 port 40003 ssh2
<86>1 2026-10-14T02:06:30.000Z bastion-02 sshd 5012 - - Failed password for rental-c from 203.0.113.60 port 40004 ssh2
<86>1 2026-10-14T02:07:00.000Z bastion-02 sshd 5013 - - Failed password for rental-d from 203.0.113.60 port 40005 ssh2
<86>1 2026-10-14T02:07:30.000Z bastion-02 sshd 5014 - - Failed password for rental-e from 203.0.113.60 port 40006 ssh2
EOF

actual=$(bash solution.sh t2-auth.log 3 5 t2-canaries.txt)
status=$?
assert_eq "$actual" "SPRAY 192.0.2.44 at 2026-10-14T02:03:30.250Z
SPRAY 203.0.113.60 at 2026-10-14T02:07:00.000Z" \
  "threshold 3 within 5 minutes: different accounts only, the window boundary in whole seconds, one alert per source"
assert_eq "$status" "1" "exit status when there are alerts"
