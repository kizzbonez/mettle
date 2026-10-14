mkdir -p bank3
printf '#!/bin/sh\necho "Backup done"\n' > bank3/backup.sh
echo "name,monthly" > bank3/salaries.csv
echo "notice" > bank3/notice.txt
chmod 755 bank3/backup.sh
chmod 666 bank3/salaries.csv
chmod 662 bank3/notice.txt

script="$PWD/solution.sh"
cd bank3 || fail "could not go into bank3"
bash "$script" > /dev/null 2>&1

assert_eq "$(stat -c %a salaries.csv)" "600" "the permissions of salaries.csv when it started as rw-rw-rw-"
assert_eq "$(stat -c %a notice.txt)" "640" "the permissions of notice.txt when it started as rw-rw--w- (only the group's and others' w may change)"
assert_eq "$(stat -c %a backup.sh)" "755" "the permissions of backup.sh when its owner could already run it"
