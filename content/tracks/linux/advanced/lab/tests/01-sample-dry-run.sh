# Build the sample backup directory from the list in data/sample-backups.txt.
mkdir -p sample
while IFS= read -r name; do
  : > "sample/$name"
done < data/sample-backups.txt

expected='keep   billing-2026-10-14.sql.gz
keep   billing-2026-10-13.sql.gz
keep   billing-2026-10-10.sql.gz
delete billing-2026-10-01.sql.gz
delete billing-2026-09-14.sql.gz
keep   crm-2026-10-12.sql.gz
keep   crm-2026-09-30.sql.gz
delete crm-2026-09-15.sql.gz
keep   crm-eu-2026-10-08.sql.gz
keep   crm-eu-2026-10-07.sql.gz
total: 7 kept, 3 deleted (dry run)'

actual=$(bash solution.sh -n -k 2 -d 7 -t 2026-10-14 sample) \
  || fail "solution.sh exited with a non-zero status on a valid dry run"
assert_eq "$actual" "$expected" "the dry-run plan for the sample directory (-n -k 2 -d 7 -t 2026-10-14)"

remaining=$(find sample -type f | wc -l)
assert_eq "$remaining" "12" "a dry run (-n) must not delete any file"
