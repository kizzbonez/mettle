# This test makes the office folder from the instructions, bank1, and gives
# the three files their starting permissions with chmod.
mkdir -p bank1
printf '#!/bin/sh\necho "Backup done"\n' > bank1/backup.sh
echo "name,monthly" > bank1/salaries.csv
echo "Volunteers: Saturday 9:00, bring gloves" > bank1/notice.txt
chmod 644 bank1/backup.sh bank1/salaries.csv
chmod 666 bank1/notice.txt

# Then it goes into bank1, runs your script there, and shows you what it
# printed and the permissions afterwards.
script="$PWD/solution.sh"
cd bank1 || fail "could not go into bank1"
printed=$(bash "$script" 2>&1)

echo "Your script printed:"
echo "$printed"
echo
echo "Permissions afterwards:"
stat -c '%A  %n' backup.sh salaries.csv notice.txt drafts drafts/plan.txt 2>&1
echo

assert_eq "$printed" "" "what the script printed, errors included (it should print nothing)"
assert_eq "$(stat -c %A backup.sh)" "-rwxr--r--" "the permissions of backup.sh"
assert_eq "$(stat -c %A salaries.csv)" "-rw-------" "the permissions of salaries.csv"
assert_eq "$(stat -c %A notice.txt)" "-rw-r--r--" "the permissions of notice.txt"
assert_eq "$(stat -c %A drafts 2> /dev/null)" "drwxr-x---" "the permissions of the folder drafts"
assert_eq "$(stat -c %A drafts/plan.txt 2> /dev/null)" "-rw-r-----" "the permissions of drafts/plan.txt"
