listing() {
  find "$1" -mindepth 1 -maxdepth 1 -printf '%f\n' | LC_ALL=C sort
}

# A directory with two databases whose names differ only by " team", a future
# backup, a backup with an impossible date, a hidden file, a non-backup file
# and a subdirectory that looks like a backup.
mkdir -p rot/old-2026-01-01.sql.gz
for d in 2026-10-14 2026-10-05 2026-10-04 2026-09-01 2026-08-01; do : > "rot/sales team-$d.sql.gz"; done
for d in 2026-10-07 2026-10-08 2026-09-01 2026-08-30 2026-08-29; do : > "rot/sales-$d.sql.gz"; done
: > rot/hr-2026-02-30.sql.gz
: > rot/hr-2026-10-20.sql.gz
: > rot/notes.txt
: > rot/.hidden-2026-01-01.sql.gz

expected='keep   hr-2026-10-20.sql.gz
keep   sales-2026-10-08.sql.gz
keep   sales-2026-10-07.sql.gz
keep   sales-2026-09-01.sql.gz
delete sales-2026-08-30.sql.gz
delete sales-2026-08-29.sql.gz
keep   sales team-2026-10-14.sql.gz
keep   sales team-2026-10-05.sql.gz
keep   sales team-2026-10-04.sql.gz
delete sales team-2026-09-01.sql.gz
delete sales team-2026-08-01.sql.gz
total: 7 kept, 4 deleted'

actual=$(bash solution.sh -t 2026-10-14 rot) || fail "solution.sh exited with a non-zero status on a valid run"
assert_eq "$actual" "$expected" "the plan with the default -k and -d: which backups are kept, which are deleted, and in what order"

expected_left='.hidden-2026-01-01.sql.gz
hr-2026-02-30.sql.gz
hr-2026-10-20.sql.gz
notes.txt
old-2026-01-01.sql.gz
sales team-2026-10-04.sql.gz
sales team-2026-10-05.sql.gz
sales team-2026-10-14.sql.gz
sales-2026-09-01.sql.gz
sales-2026-10-07.sql.gz
sales-2026-10-08.sql.gz'
assert_eq "$(listing rot)" "$expected_left" "exactly the backups marked delete are removed, and every other entry is left alone"

# The age limit is strict: a backup exactly DAYS days old is not protected by -d.
mkdir -p edge
for d in 2026-10-14 2026-10-08 2026-10-07; do : > "edge/app-$d.sql.gz"; done
expected='keep   app-2026-10-14.sql.gz
keep   app-2026-10-08.sql.gz
delete app-2026-10-07.sql.gz
total: 2 kept, 1 deleted'
actual=$(bash solution.sh -k 1 -d 7 -t 2026-10-14 edge) || fail "solution.sh exited with a non-zero status with -k 1 -d 7"
assert_eq "$actual" "$expected" "with -k 1 -d 7, the boundary between kept and deleted ages"

# -d 0 protects nothing by age, so only the newest KEEP survive.
mkdir -p zero
for d in 2026-10-14 2026-10-13; do : > "zero/web-$d.sql.gz"; done
actual=$(bash solution.sh -k 1 -d 0 -t 2026-10-14 zero) || fail "solution.sh exited with a non-zero status with -d 0"
assert_eq "$actual" "keep   web-2026-10-14.sql.gz
delete web-2026-10-13.sql.gz
total: 1 kept, 1 deleted" "with -d 0 only the KEEP rule protects backups"

# An empty directory is not an error.
mkdir -p empty
actual=$(bash solution.sh -t 2026-10-14 empty) || fail "an empty directory must still exit with status 0"
assert_eq "$actual" "total: 0 kept, 0 deleted" "an empty directory prints only the total"

# A directory whose name starts with a dash, passed after --.
mkdir -p -- -odd
: > -odd/app-2026-10-01.sql.gz
actual=$(bash solution.sh -n -t 2026-10-14 -- -odd) || fail "a directory named after -- must be accepted"
assert_eq "$actual" "keep   app-2026-10-01.sql.gz
total: 1 kept, 0 deleted (dry run)" "a directory whose name starts with a dash, given after --"
