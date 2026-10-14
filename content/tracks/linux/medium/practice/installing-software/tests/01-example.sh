expected='gawk: ok
jq: 1.6-2.1 installed, 1.7.1-3 wanted
nginx: not installed
curl: ok
python3: ok
problems: 2'

actual=$(bash solution.sh data/dpkg-l.txt data/wanted.txt)
status=$?
assert_eq "$actual" "$expected" "the report for data/dpkg-l.txt and data/wanted.txt"
assert_eq "$status" "1" "exit status when some packages do not match"
