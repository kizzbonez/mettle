actual=$(bash solution.sh data/db02.txt 22,5432)
status=$?
assert_eq "$actual" "findings: 0" "report for data/db02.txt with ports 22,5432 allowed"
assert_eq "$status" "0" "exit status when there are no findings"

cat > partial.txt <<'EOF'
### df -hT
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/vda1      ext4   20G  6.0G   13G  32% /

### getent passwd
root:x:0:0:root:/root:/bin/bash
lee:x:1000:1000::/home/lee:/bin/bash

EOF
actual=$(bash solution.sh partial.txt 22)
status=$?
assert_eq "$actual" "skip: systemctl --failed not collected
skip: ss -tlnp not collected
skip: cat /etc/ssh/sshd_config not collected
skip: getent shadow not collected
findings: 0" "a bundle with missing sections and nothing wrong"
assert_eq "$status" "0" "exit status when sections are missing but nothing is wrong"

cat > one-finding.txt <<'EOF'
### getent passwd
root:x:0:0:root:/root:/bin/bash
maint:x:0:0::/root:/bin/bash

EOF
actual=$(bash solution.sh one-finding.txt 22 | grep -v '^skip:')
assert_eq "$actual" "account: maint has UID 0
findings: 1" "skipped sections are not counted as findings"
bash solution.sh one-finding.txt 22 > /dev/null
assert_eq "$?" "1" "exit status with a single finding"
