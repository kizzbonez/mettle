bash solution.sh > card4.txt 2> errors4.txt || fail "solution.sh finished with a non-zero exit status"

assert_eq "$(cat errors4.txt)" "" "messages on standard error (a command complained)"
assert_eq "$(wc -l < card4.txt)" "8" "the number of lines on the card"
assert_eq "$(sed -n '1p;2p;4p;6p' card4.txt)" "== Machine card ==
Kernel:
Operating system:
Distribution:" "the heading and the three labels, in their places"
assert_eq "$(tail -n 2 card4.txt)" "$(head -n 2 /etc/os-release)" "the two distribution lines at the end of the card"
