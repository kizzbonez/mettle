# A deeper folder: the archive must be gzip-compressed tar, store every member
# under wedding/, and give back exactly the folder when extracted.
mkdir -p wedding/ceremony/close-ups wedding/party
printf 'rings\n' > wedding/ceremony/close-ups/rings.txt
printf 'vows\n' > wedding/ceremony/vows.txt
printf 'first dance\n' > wedding/party/dance.txt
printf 'order of the day\n' > wedding/order.txt

bash solution.sh wedding > /dev/null || fail "solution.sh exited with a non-zero status"
[ -f wedding.tar.gz ] || fail "wedding.tar.gz was not created"
gzip -t wedding.tar.gz 2> /dev/null || fail "wedding.tar.gz is not compressed with gzip"
members=$(tar -tzf wedding.tar.gz 2> /dev/null) || fail "wedding.tar.gz is not a tar archive"

outside=$(printf '%s\n' "$members" | grep -v '^wedding/')
assert_eq "$outside" "" "archive members whose names do not start with wedding/"

mkdir -p unpacked-wedding
tar -xzf wedding.tar.gz -C unpacked-wedding || fail "wedding.tar.gz could not be extracted"
diff -r unpacked-wedding/wedding wedding > /dev/null || fail "the extracted archive differs from the folder wedding"
