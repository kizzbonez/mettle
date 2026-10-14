# Comments, an empty line, a line of spaces, a version that differs only in its
# epoch, and a last line without a newline.
printf '# build tools\n   \ngit 2.39.5-0+deb12u1\n#jq 1.6-2.1\n\ntar 1.34+dfsg-1.2+deb12u1\ngawk 1:5.2.1-2' > pins-tools.txt

expected='git: 1:2.39.5-0+deb12u1 installed, 2.39.5-0+deb12u1 wanted
tar: ok
gawk: ok
problems: 1'

actual=$(bash solution.sh data/dpkg-l.txt pins-tools.txt)
status=$?
assert_eq "$actual" "$expected" "comments, blank lines, whole versions with epochs, and a last line without a newline"
assert_eq "$status" "1" "exit status when one package has another version"
