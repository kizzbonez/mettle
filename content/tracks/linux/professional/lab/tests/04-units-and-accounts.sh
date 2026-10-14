cat > units.txt <<'EOF'
### systemctl --failed
  UNIT                  LOAD   ACTIVE SUB    DESCRIPTION
● mnt-backup.mount      loaded failed failed /mnt/backup
● php8.2-fpm.service    loaded failed failed The PHP 8.2 FastCGI Process Manager
● reportd-cleanup.timer loaded failed failed Daily cleanup of old reports

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
3 loaded units listed.

EOF
actual=$(bash solution.sh units.txt "" | grep '^unit:')
assert_eq "$actual" "unit: mnt-backup.mount (/mnt/backup)
unit: php8.2-fpm.service (The PHP 8.2 FastCGI Process Manager)
unit: reportd-cleanup.timer (Daily cleanup of old reports)" \
  "failed units of several types, with descriptions of one or more words"

cat > accounts.txt <<'EOF'
### getent passwd
root:x:0:0:root:/root:/bin/bash
ops:x:1003:0:Operations:/home/ops:/bin/bash
admin:x:0:1004::/home/admin:/bin/sh
svc0:x:1010:1010::/home/svc0:/bin/bash
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin

### getent shadow
root:!:20700:0:99999:7:::
ops:$y$j9T$Lw3Ke7Rt1Yu5Io9Pa2Sd6Fg.$Zx8Cv4Bn0Mq2We6Rt8Yu4Io0Pa6Sd2Fg8Hj4Kl0Zx1:20700:0:99999:7:::
admin:*:20700:0:99999:7:::
svc0::20738:0:99999:7:::
backup:!*:20650::::::

EOF
actual=$(bash solution.sh accounts.txt "" | grep '^account:')
assert_eq "$actual" "account: admin has UID 0
account: svc0 has an empty password" \
  "UID 0 only in the UID field, locked passwords, and blank lines between sections"
