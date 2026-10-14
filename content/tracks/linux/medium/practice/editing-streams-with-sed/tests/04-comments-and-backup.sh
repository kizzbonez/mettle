# A file name with spaces; comments, empty lines and # inside values;
# the last line is a comment without a newline.
printf '#top\n\nname=Kiosk #2\n##\nvolume=10 # quiet\n\n\nurl=http://k.example/\n# end' > 'gift shop.conf'
cp 'gift shop.conf' original.conf

out=$(bash solution.sh 'gift shop.conf') || fail "solution.sh exited with a non-zero status for a file name with spaces"
assert_eq "$out" "" "what solution.sh prints on standard output"

expected='name=Kiosk #2
volume=10 # quiet
url=https://k.example/'
assert_eq "$(cat 'gift shop.conf')" "$expected" "comment lines and empty lines removed, other lines kept, in a file whose name contains spaces"

[ -f 'gift shop.conf.bak' ] || fail "the backup was not created next to a file whose name contains spaces"
cmp -s 'gift shop.conf.bak' original.conf || fail "the backup does not hold the original text"
