mkdir -p fs/usr/bin fs/usr/sbin fs/tmp/.cache
touch fs/usr/bin/{passwd,chsh,su,mount,chage} fs/usr/sbin/unix_chkpwd fs/tmp/.cache/bash
chmod 4755 fs/usr/bin/passwd fs/usr/bin/chsh fs/tmp/.cache/bash
chmod 6755 fs/usr/bin/su
chmod 0755 fs/usr/bin/mount
chmod 2755 fs/usr/bin/chage fs/usr/sbin/unix_chkpwd

actual=$(bash solution.sh fs data/suid-baseline.txt)
status=$?
assert_eq "$actual" "new: fs/tmp/.cache/bash (4755)
changed: fs/usr/bin/su (4755 -> 6755)
gone: fs/usr/bin/mount" "differences between the tree in the example and data/suid-baseline.txt"
assert_eq "$status" "1" "exit status when there are differences"
