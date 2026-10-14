out=$(bash solution.sh data/notes.txt)
status=$?
assert_eq "$out" "accepted: text" "what is printed for data/notes.txt"
assert_eq "$status" "0" "exit status for data/notes.txt"

head -c 1200 /dev/zero > diagram.png
out=$(bash solution.sh diagram.png)
status=$?
assert_eq "$out" "rejected: too large" "what is printed for a 1200-byte diagram.png"
assert_eq "$status" "1" "exit status for a 1200-byte diagram.png"
