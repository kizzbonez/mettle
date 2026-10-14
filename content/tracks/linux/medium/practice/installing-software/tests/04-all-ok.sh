# Everything matches, and both file names contain spaces.
cp data/dpkg-l.txt 'server 3 packages.txt'
printf 'jq 1.6-2.1\npython3-minimal 3.11.2-1+b1\ncurl 7.88.1-10+deb12u8\n' > 'pinned list.txt'

actual=$(bash solution.sh 'server 3 packages.txt' 'pinned list.txt')
status=$?
assert_eq "$actual" 'jq: ok
python3-minimal: ok
curl: ok
problems: 0' "a pinned list that matches completely, with file names that contain spaces"
assert_eq "$status" "0" "exit status when every package matches"

# A pinned list with nothing but comments.
printf '# nothing pinned yet\n' > pins-empty.txt
actual=$(bash solution.sh data/dpkg-l.txt pins-empty.txt)
status=$?
assert_eq "$actual" 'problems: 0' "a pinned list with only a comment"
assert_eq "$status" "0" "exit status when nothing is pinned"
