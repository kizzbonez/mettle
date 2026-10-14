mkdir -p session2
cd session2 || fail "could not go into session2"
touch take-1.wav take-9.wav take-10.wav take-12.wav take-100.wav take-5.wav.bak take-6.WAV
echo "take four, the good one" > take-4.wav
touch notes.txt "rough cut.wav"

bash ../solution.sh > /dev/null 2>&1

assert_eq "$(ls -A episode/takes 2> /dev/null)" "take-1.wav
take-4.wav
take-9.wav" "the files copied into episode/takes (one character between take- and .wav)"
assert_eq "$(cat episode/takes/take-4.wav 2> /dev/null)" "take four, the good one" "the contents of a copied take"
[ -f take-4.wav ] || fail "take-4.wav is no longer in the recording folder (copy, never move)"
[ -d episode/notes ] || fail "the folder episode/notes was not created"
