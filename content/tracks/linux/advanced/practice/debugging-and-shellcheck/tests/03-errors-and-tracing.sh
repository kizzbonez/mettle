touch not-a-dir
mkdir -p traced/album
touch traced/album/p.jpg

# check_cannot_enter DESCRIPTION DIR
check_cannot_enter() {
  local what=$1 out status
  out=$(env -u ALBUM_TRACE bash solution.sh "$2" 2> err3.txt)
  status=$?
  assert_eq "$status" "1" "$what: exit status"
  assert_eq "$out" "" "$what: nothing on standard output"
  assert_eq "$(cat err3.txt)" "album-report: cannot enter $2" "$what: the only line on standard error"
}
check_cannot_enter "a directory that does not exist" 'no such dir'
check_cannot_enter "a file instead of a directory" not-a-dir

expected="album: 1 photos
total: 1 photos"
out=$(ALBUM_TRACE=1 bash solution.sh traced 2> trace.txt)
assert_eq "$?" "0" "exit status with ALBUM_TRACE=1"
assert_eq "$out" "$expected" "standard output with ALBUM_TRACE=1 is the same as without it"
grep -Eq '^\+ [0-9]+:main: ' trace.txt \
  || fail "with ALBUM_TRACE=1, traced lines from main show the line number and the function name"
grep -Eq '^\+\+ [0-9]+:count_photos: ' trace.txt \
  || fail "with ALBUM_TRACE=1, traced lines inside count_photos show the line number and the function name"

out=$(ALBUM_TRACE=0 bash solution.sh traced 2> trace0.txt)
assert_eq "$out" "$expected" "standard output with ALBUM_TRACE=0"
assert_eq "$(cat trace0.txt)" "" "nothing is traced when ALBUM_TRACE is not 1"
