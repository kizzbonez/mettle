# This test copies the four files from data/ into the folder radio1, goes
# into it, runs your script there, and shows you what playlist.txt holds.
mkdir -p radio1
cp data/playlist.txt data/studio.conf data/notes.txt data/rota.txt radio1/
script="$PWD/solution.sh"
cd radio1 || fail "could not go into radio1"
printed=$(bash "$script" 2>&1)

echo "Your script printed:"
echo "$printed"
echo
echo "playlist.txt now holds:"
cat playlist.txt
echo

printf '06:00 news\n06:10 traffic\n06:15 music\n06:20 sport\n' > ../expected1.txt
assert_eq "$(cat playlist.txt)" "$(cat ../expected1.txt)" "the lines of playlist.txt after the vi keys"
cmp -s playlist.txt ../expected1.txt || fail "playlist.txt has the right lines but not exactly the right characters (look for spaces at the ends of lines or a missing newline at the end)"
