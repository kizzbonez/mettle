# Old and new .tmp files, old files with other names, empty files and
# directories, and a directory named like a .tmp file.
mkdir -p 'cache/sub dir' cache/spare cache/stale.tmp
printf 'x' > cache/a.tmp
printf 'x' > cache/b.tmp
printf 'x' > cache/old.png
printf 'x' > cache/report.tmp.txt
printf 'x' > 'cache/sub dir/c d.tmp'
: > 'cache/sub dir/empty file.txt'
: > cache/fresh-empty.tmp
touch -d '30 days ago' cache/a.tmp cache/old.png cache/report.tmp.txt 'cache/sub dir/c d.tmp' cache/stale.tmp cache/spare

expected='cache/a.tmp
cache/fresh-empty.tmp
cache/sub dir/c d.tmp
cache/sub dir/empty file.txt
errors: 0'

actual=$(bash solution.sh cache) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "which files are deleted: old .tmp files and empty files only"

[ -f cache/b.tmp ] || fail "a .tmp file modified just now was deleted"
[ -f cache/old.png ] || fail "an old file that is not named *.tmp was deleted"
[ -f cache/report.tmp.txt ] || fail "an old file whose name does not end in .tmp was deleted"
[ -d cache/stale.tmp ] || fail "an old empty directory whose name ends in .tmp was deleted"
[ -d cache/spare ] || fail "an empty directory was deleted"
[ -d 'cache/sub dir' ] || fail "a directory was deleted"
