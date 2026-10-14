mkdir up3
printf 'Station 9 upload.\n' > up3/README.txt
printf 'time,temp_c\n06:00,4.2\n' > up3/morning.csv
printf 'time,temp_c\n18:00,6.0\n' > up3/evening.csv
printf '06:00 INFO ok\n' > up3/station.log
touch up3/empty.txt

bash solution.sh up3 rel3 > /dev/null || fail "solution.sh exited with a non-zero status"

for file in rel3/readings/morning.csv rel3/readings/evening.csv rel3/notes/README.txt rel3/notes/empty.txt; do
  [ -f "$file" ] || fail "$file was not copied"
  assert_eq "$(stat -c %a "$file")" "444" "the permissions of $file"
done
assert_eq "$(stat -c %a rel3/logs)" "700" "the permissions of the logs folder"
assert_eq "$(stat -c %a rel3/readings)" "755" "the permissions of the readings folder itself"
assert_eq "$(stat -c %a rel3/notes)" "755" "the permissions of the notes folder itself"

[ -L rel3/README.txt ] || fail "README.txt in the release folder is not a symbolic link"
assert_eq "$(readlink rel3/README.txt)" "notes/README.txt" "the target stored in the README.txt link"

mv rel3 "moved release"
assert_eq "$(cat "moved release/README.txt" 2> /dev/null)" "Station 9 upload." \
  "reading README.txt through the link after the release folder was moved"
