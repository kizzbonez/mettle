mkdir -p session4
cd session4 || fail "could not go into session4"
touch "rough cut.wav" cut.wav "rough mix.wav" take-2.wav "running order.txt"

printed=$(bash ../solution.sh 2> ../errors4.txt) || fail "solution.sh finished with a non-zero exit status"

assert_eq "$printed" 'Next week: "Rivers & Bridges" at 8:00, *live*' "the trailer line, character for character"
assert_eq "$(cat ../errors4.txt)" "" "messages on standard error (a command complained)"
[ -e "rough cut.wav" ] && fail "rough cut.wav is still there"
assert_eq "$(ls -A)" "cut.wav
episode
rough mix.wav
running order.txt
take-2.wav" "the names left in the recording folder (only rough cut.wav may go)"
