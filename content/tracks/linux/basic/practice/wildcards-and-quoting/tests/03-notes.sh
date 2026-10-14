mkdir -p session3
cd session3 || fail "could not go into session3"
echo "Maria Lopez, retired ferry captain" > "Guest List.txt"
touch "show notes.txt" a.txt .private.txt notes.txt.old README.TXT take-1.wav "rough cut.wav"

bash ../solution.sh > /dev/null 2>&1

assert_eq "$(ls -A episode/notes 2> /dev/null)" "Guest List.txt
a.txt
show notes.txt" "the files copied into episode/notes (names ending in .txt, spaces included, hidden ones left out)"
assert_eq "$(cat "episode/notes/Guest List.txt" 2> /dev/null)" "Maria Lopez, retired ferry captain" "the contents of a copied note whose name has a space"
[ -f "Guest List.txt" ] || fail "Guest List.txt is no longer in the recording folder (copy, never move)"
