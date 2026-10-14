mkdir -p bank2
printf '#!/bin/sh\necho "Backup done"\n' > bank2/backup.sh
echo "name,monthly" > bank2/salaries.csv
echo "notice" > bank2/notice.txt
chmod 640 bank2/backup.sh
chmod 644 bank2/salaries.csv bank2/notice.txt

script="$PWD/solution.sh"
cd bank2 || fail "could not go into bank2"
bash "$script" > /dev/null 2>&1

assert_eq "$(stat -c %a backup.sh)" "740" "the permissions of backup.sh when it started as rw-r----- (only the owner's x may change)"
assert_eq "$(./backup.sh 2>&1)" "Backup done" "running ./backup.sh"
