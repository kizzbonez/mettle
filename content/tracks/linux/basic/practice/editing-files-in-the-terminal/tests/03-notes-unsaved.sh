mkdir -p radio3
cp data/playlist.txt data/studio.conf data/notes.txt data/rota.txt radio3/
script="$PWD/solution.sh"
cd radio3 || fail "could not go into radio3"
bash "$script" > /dev/null 2>&1

assert_eq "$(cat notes.txt 2> /dev/null)" "$(cat ../data/notes.txt)" "the lines of notes.txt after the vi keys"
cmp -s notes.txt ../data/notes.txt || fail "notes.txt has the right lines but not exactly the right characters"
