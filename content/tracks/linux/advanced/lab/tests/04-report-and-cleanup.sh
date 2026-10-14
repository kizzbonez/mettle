# Temporary files created with mktemp land in TMPDIR; it must be empty afterwards.
mkdir -p r/backups r/out r/tmp f/backups f/out
export TMPDIR=$PWD/r/tmp

# A successful run replaces an existing report with exactly what it printed.
for d in 2026-10-14 2026-10-13 2026-10-12 2026-10-11 2026-09-01; do : > "r/backups/shop-$d.sql.gz"; done
printf 'last week\n' > r/out/report.txt
out=$(bash solution.sh -k 2 -d 1 -r r/out/report.txt -t 2026-10-14 r/backups) \
  || fail "a valid run with -r exited with a non-zero status"
assert_eq "$out" "keep   shop-2026-10-14.sql.gz
keep   shop-2026-10-13.sql.gz
delete shop-2026-10-12.sql.gz
delete shop-2026-10-11.sql.gz
delete shop-2026-09-01.sql.gz
total: 2 kept, 3 deleted" "the plan printed with -k 2 -d 1 -r REPORT"
assert_eq "$(cat r/out/report.txt)" "$out" "the report file holds exactly the lines printed on standard output"
assert_eq "$(ls -A r/out)" "report.txt" "after a successful run nothing but the report is left in its directory"
assert_eq "$(ls -A r/tmp)" "" "no temporary files are left in TMPDIR after a successful run"

# A backup that cannot be deleted stops the run; the old report must survive untouched.
for d in 2026-10-14 2026-10-01 2026-09-01 2026-08-01; do : > "f/backups/shop-$d.sql.gz"; done
printf 'last week\n' > f/out/report.txt
chmod a-w f/backups
bash solution.sh -k 1 -d 1 -r f/out/report.txt -t 2026-10-14 f/backups > /dev/null 2> f/err.txt
status=$?
chmod u+w f/backups
assert_eq "$status" "1" "a backup that cannot be deleted gives exit status 1"
grep -q '^rotate-backups: cannot delete shop-2026-10-01.sql.gz$' f/err.txt \
  || fail "the error message names the first backup that could not be deleted, in the form the instructions give"
assert_eq "$(cat f/out/report.txt)" "last week" "after a failed run the previous report is left unchanged"
assert_eq "$(ls -A f/out)" "report.txt" "after a failed run no temporary file is left next to the report"
assert_eq "$(ls -A r/tmp)" "" "no temporary files are left in TMPDIR after a failed run"
