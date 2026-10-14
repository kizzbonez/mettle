# No argument, and two arguments.
out=$(bash solution.sh 2> err.txt)
status=$?
assert_eq "$status" "2" "exit status when no argument is given"
assert_eq "$out" "" "standard output when no argument is given"
assert_eq "$(cat err.txt)" "usage: solution.sh FILE" "standard error when no argument is given"

out=$(bash solution.sh data/notes.txt data/notes.txt 2> err.txt)
status=$?
assert_eq "$status" "2" "exit status when two arguments are given"
assert_eq "$out" "" "standard output when two arguments are given"
assert_eq "$(cat err.txt)" "usage: solution.sh FILE" "standard error when two arguments are given"

# A missing file whose name has spaces, and a directory named like an image.
out=$(bash solution.sh 'no such file.txt' 2> err.txt)
status=$?
assert_eq "$status" "2" "exit status when the file does not exist"
assert_eq "$out" "" "standard output when the file does not exist"
assert_eq "$(cat err.txt)" "not a file: no such file.txt" "standard error when the file does not exist"

mkdir -p photos.png
printf 'inside\n' > photos.png/one.txt
out=$(bash solution.sh photos.png 2> err.txt)
status=$?
assert_eq "$status" "2" "exit status when FILE is a directory"
assert_eq "$out" "" "standard output when FILE is a directory"
assert_eq "$(cat err.txt)" "not a file: photos.png" "standard error when FILE is a directory"
