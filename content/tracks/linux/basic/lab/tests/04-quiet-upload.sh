mkdir quiet
printf 'Nothing was recorded this week: the logger was in for repair.\n' > quiet/README.txt

actual=$(bash solution.sh quiet rel4 2> errors4.txt) || fail "solution.sh exited with a non-zero status for an upload with no readings or logs"

expected='readings: 0
logs: 0
notes: 1
errors: 0'
assert_eq "$actual" "$expected" "the summary for an upload that holds only README.txt"
assert_eq "$(cat errors4.txt)" "" "standard error when the upload has no CSV or log files"

for folder in readings logs notes; do
  [ -d "rel4/$folder" ] || fail "rel4/$folder does not exist (the subfolders are needed even when empty)"
done
assert_eq "$(stat -c %a rel4/logs)" "700" "the permissions of an empty logs folder"
