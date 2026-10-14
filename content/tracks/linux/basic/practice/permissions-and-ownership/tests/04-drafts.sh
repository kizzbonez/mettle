mkdir -p bank4
printf '#!/bin/sh\necho "Backup done"\n' > bank4/backup.sh
echo "name,monthly" > bank4/salaries.csv
echo "notice" > bank4/notice.txt
chmod 600 bank4/backup.sh bank4/salaries.csv
chmod 640 bank4/notice.txt

script="$PWD/solution.sh"
cd bank4 || fail "could not go into bank4"
printed=$(bash "$script" 2>&1) || fail "solution.sh finished with a non-zero exit status"

assert_eq "$printed" "" "what the script printed, errors included"
[ -d drafts ] || fail "the folder drafts was not created"
[ -f drafts/plan.txt ] || fail "drafts/plan.txt was not created"
assert_eq "$(stat -c %a drafts)" "750" "the permissions of the folder drafts"
assert_eq "$(stat -c %a drafts/plan.txt)" "640" "the permissions of drafts/plan.txt"
assert_eq "$(stat -c %s drafts/plan.txt)" "0" "the size of drafts/plan.txt (it should be empty)"
assert_eq "$(stat -c %a backup.sh)" "700" "the permissions of backup.sh when it started as rw-------"
