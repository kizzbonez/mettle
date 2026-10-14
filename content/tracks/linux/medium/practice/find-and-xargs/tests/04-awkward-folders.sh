# A folder whose name has a space, an empty file deep inside, and no .log files.
mkdir -p 'render cache/a/b/c'
: > 'render cache/a/b/c/empty.dat'
printf 'keep me\n' > 'render cache/a/keep.dat'

actual=$(bash solution.sh 'render cache') || fail "solution.sh exited with a non-zero status for a folder name with spaces"
assert_eq "$actual" 'render cache/a/b/c/empty.dat
errors: 0' "a folder whose name contains spaces and that holds no .log files"
[ -f 'render cache/a/keep.dat' ] || fail "a file that is neither empty nor .tmp was deleted"

# A folder with nothing in it at all.
mkdir -p bare
actual=$(bash solution.sh bare) || fail "solution.sh exited with a non-zero status for an empty folder"
assert_eq "$actual" 'errors: 0' "an empty folder"
[ -d bare ] || fail "the folder given as DIR was deleted"
