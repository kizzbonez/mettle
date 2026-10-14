mkdir -p radio4
cp data/playlist.txt data/studio.conf data/notes.txt data/rota.txt radio4/
script="$PWD/solution.sh"
cd radio4 || fail "could not go into radio4"
printed=$(bash "$script" 2>&1)

printf 'Mon Ana\nTue Ben\nWed Cy\nTue Ben\n' > ../expected4.txt
assert_eq "$(cat rota.txt)" "$(cat ../expected4.txt)" "the lines of rota.txt after the vi keys"
cmp -s rota.txt ../expected4.txt || fail "rota.txt has the right lines but not exactly the right characters"
assert_eq "$printed" "" "what the script printed, errors included"
assert_eq "$(ls -A)" "notes.txt
playlist.txt
rota.txt
studio.conf" "the files in the folder after the script (no new ones)"
