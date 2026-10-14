root='my shoots'
mkdir -p "$root/[2026] trip" "$root/a  b" "$root/mixed/fake.jpg" "$root/.cache" "$root/empty dir"
touch "$root/[2026] trip/x.jpg" "$root/[2026] trip/y.jpg" "$root/a  b/one.jpg"
touch "$root/mixed/real.jpg" "$root/mixed/.hidden.jpg" "$root/mixed/pic.jpeg" "$root/mixed/raw.jpg.bak"
touch "$root/.cache/thumb.jpg" "$root/loose.jpg"
# Single-character names that an unquoted [2026] would match as a glob.
touch 2 0 6 "$root/2" "$root/0" "$root/6"

out=$(env -u ALBUM_TRACE bash solution.sh "$root" 2> err2.txt)
assert_eq "$?" "0" "exit status for a directory with awkward album names"
assert_eq "$out" "[2026] trip: 2 photos
a  b: 1 photos
empty dir: 0 photos
mixed: 1 photos
total: 4 photos" "albums with spaces, brackets, a hidden album, a fake .jpg directory and other file types"
assert_eq "$(cat err2.txt)" "" "nothing on standard error for awkward album names"

mkdir -p -- -old/2019
touch -- -old/2019/a.jpg
out=$(env -u ALBUM_TRACE bash solution.sh -old 2> err2.txt)
assert_eq "$?" "0" "exit status for a DIR whose name starts with a dash"
assert_eq "$out" "2019: 1 photos
total: 1 photos" "the output for a DIR whose name starts with a dash"

mkdir -p no-albums
touch no-albums/stray.jpg
out=$(env -u ALBUM_TRACE bash solution.sh no-albums 2> err2.txt)
assert_eq "$?" "0" "exit status for a directory without albums"
assert_eq "$out" "total: 0 photos" "the output for a directory without albums"
assert_eq "$(cat err2.txt)" "" "nothing on standard error for a directory without albums"
