# This test makes the recording folder from the instructions, session1.
mkdir -p session1
touch session1/.session-lock "session1/guest bio.txt" session1/intro.wav "session1/rough cut.wav" "session1/show notes.txt"
touch session1/take-1.wav session1/take-10.wav session1/take-11.wav session1/take-2.wav session1/take-3.wav

# Then it goes into session1, runs your script there, and shows you what it
# printed and what the two new folders hold.
script="$PWD/solution.sh"
cd session1 || fail "could not go into session1"
printed=$(bash "$script" 2>&1)

echo "Your script printed:"
echo "$printed"
echo
echo "episode/takes holds:"
ls -A episode/takes 2>&1
echo
echo "episode/notes holds:"
ls -A episode/notes 2>&1
echo

assert_eq "$printed" 'Next week: "Rivers & Bridges" at 8:00, *live*' "what the script printed, errors included"
assert_eq "$(ls -A episode/takes 2> /dev/null)" "take-1.wav
take-2.wav
take-3.wav" "the files copied into episode/takes"
assert_eq "$(ls -A episode/notes 2> /dev/null)" "guest bio.txt
show notes.txt" "the files copied into episode/notes"
assert_eq "$(ls -A)" ".session-lock
episode
guest bio.txt
intro.wav
show notes.txt
take-1.wav
take-10.wav
take-11.wav
take-2.wav
take-3.wav" "the names left in session1 (copies leave the originals; only rough cut.wav goes)"
