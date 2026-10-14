# Files in the current directory that an unquoted expansion would glob into.
touch aXb_take.wav aZb
cat > odd.txt <<'EOF'
/srv/v1.2/take one
Take  2 Final.wav
Room Tone .wav
a*b take.WAV
mix.v2.final.MP3
/srv/studio/-intro.wav
EOF

out=$(env -u PREFIX bash solution.sh odd.txt)
assert_eq "$?" "0" "exit status for a list of awkward names"
assert_eq "$out" "take one -> take_one
Take  2 Final.wav -> take__2_final.wav
Room Tone .wav -> room_tone_.wav
a*b take.WAV -> a*b_take.wav
mix.v2.final.MP3 -> mix.v2.final.mp3
-intro.wav -> -intro.wav
(none): 1
mp3: 1
wav: 4" "names with dots in the directory, double spaces, several dots, glob characters and a leading dash"
