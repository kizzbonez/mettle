mkdir -p farm/frames farm/logs 'farm/logs/old runs'
printf 'x' > farm/frames/f001.tmp
touch -d '30 days ago' farm/frames/f001.tmp
printf 'x' > farm/frames/f002.tmp
: > farm/frames/f003.png
cp data/render.log farm/logs/render.log
cp data/batch.log 'farm/logs/old runs/batch 12.log'
cp data/notes.txt farm/notes.txt

expected='farm/frames/f001.tmp
farm/frames/f003.png
errors: 4'

actual=$(bash solution.sh farm) || fail "solution.sh exited with a non-zero status for the folder farm"
assert_eq "$actual" "$expected" "the deleted files and the ERROR count for the folder farm"

[ ! -e farm/frames/f001.tmp ] || fail "farm/frames/f001.tmp (an old .tmp file) was not deleted"
[ ! -e farm/frames/f003.png ] || fail "farm/frames/f003.png (an empty file) was not deleted"
[ -f farm/frames/f002.tmp ] || fail "farm/frames/f002.tmp (a recent .tmp file) was deleted"
[ -f 'farm/logs/old runs/batch 12.log' ] || fail "a log file was deleted"
