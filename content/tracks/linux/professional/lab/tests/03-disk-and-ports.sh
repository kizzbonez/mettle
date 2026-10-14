cat > disks.txt <<'EOF'
### df -hT
Filesystem     Type      Size  Used Avail Use% Mounted on
/dev/sda1      ext4       50G   44G  5.1G  90% /
/dev/sdb1      xfs       2.0T  1.8T  225G  89% /srv/archive
/dev/sdc1      ext4      916G  916G     0 100% /srv/uploads
tmpfs          tmpfs      16G   16G     0 100% /run/shm-cache
devtmpfs       devtmpfs  7.8G     0  7.8G   0% /dev
/dev/loop3     squashfs   55M   55M     0 100% /snap/core18/2829

EOF
actual=$(bash solution.sh disks.txt "" | grep '^disk:')
assert_eq "$actual" "disk: / at 90%
disk: /srv/uploads at 100%" "the 90% threshold and the filesystem types to skip"

cat > sockets.txt <<'EOF'
### ss -tlnp
State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      128          0.0.0.0:22        0.0.0.0:*
LISTEN 0      4096       127.0.0.1:8125      0.0.0.0:*
LISTEN 0      511                *:8080            *:*     users:(("java",pid=3310,fd=88))
LISTEN 0      511             [::]:8080         [::]:*     users:(("java",pid=3310,fd=89))
LISTEN 0      128            [::1]:631          [::]:*
LISTEN 0      100        10.0.3.15:25        0.0.0.0:*

EOF
actual=$(bash solution.sh sockets.txt "" | grep '^port:')
assert_eq "$actual" "port: 22 on 0.0.0.0 by ?
port: 8080 on * by java
port: 8080 on [::] by java
port: 25 on 10.0.3.15 by ?" "an empty allow list, IPv6 and loopback addresses, and lines without a process"

actual=$(bash solution.sh sockets.txt 22,8080 | grep '^port:')
assert_eq "$actual" "port: 25 on 10.0.3.15 by ?" "ports on the allow list are not reported"

actual=$(bash solution.sh sockets.txt 80,2,2500 | grep '^port:')
assert_eq "$actual" "port: 22 on 0.0.0.0 by ?
port: 8080 on * by java
port: 8080 on [::] by java
port: 25 on 10.0.3.15 by ?" "allowed ports must match the whole port number"
