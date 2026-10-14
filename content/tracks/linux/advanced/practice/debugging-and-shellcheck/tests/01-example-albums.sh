mkdir -p 'photos/2026 summer' photos/-raw photos/family
touch 'photos/2026 summer/beach.jpg' 'photos/2026 summer/sunset 2.jpg' 'photos/2026 summer/notes.txt'
touch photos/-raw/a.jpg photos/-raw/b.jpg photos/-raw/c.JPG photos/cover.jpg

out=$(env -u ALBUM_TRACE bash solution.sh photos 2> err1.txt)
assert_eq "$?" "0" "exit status for the example photos directory"
assert_eq "$out" "-raw: 2 photos
2026 summer: 2 photos
family: 0 photos
total: 4 photos" "the albums and the total printed for the example photos directory"
assert_eq "$(cat err1.txt)" "" "nothing on standard error without ALBUM_TRACE"
