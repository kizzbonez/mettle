mkdir -p radio2
cp data/playlist.txt data/studio.conf data/notes.txt data/rota.txt radio2/
script="$PWD/solution.sh"
cd radio2 || fail "could not go into radio2"
bash "$script" > /dev/null 2>&1

printf 'volume=7\nmic=on\nlights=off\n' > ../expected2.txt
assert_eq "$(cat studio.conf)" "$(cat ../expected2.txt)" "the lines of studio.conf after the nano keys"
cmp -s studio.conf ../expected2.txt || fail "studio.conf has the right lines but not exactly the right characters"
