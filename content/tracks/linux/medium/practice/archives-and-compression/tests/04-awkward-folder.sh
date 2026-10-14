# A folder name with a space, a hidden file, an empty folder and a file name with a space.
mkdir -p 'client handoff/exports' 'client handoff/stills'
printf 'colour notes\n' > 'client handoff/.notes'
printf 'final cut\n' > 'client handoff/final cut.txt'
printf 'frame one\n' > 'client handoff/stills/frame 001.txt'
cp -R 'client handoff' reference-copy

expected='client handoff/.notes
client handoff/final cut.txt
client handoff/stills/frame 001.txt'

actual=$(bash solution.sh 'client handoff') || fail "solution.sh exited with a non-zero status for a folder name with spaces"
assert_eq "$actual" "$expected" "the files listed for a folder with spaces, a hidden file and an empty folder"

assert_eq "$(sha256sum -c 'client handoff.tar.gz.sha256' 2>&1)" "client handoff.tar.gz: OK" \
  "what sha256sum -c reports for a folder name with spaces"

mkdir -p unpacked-handoff
tar -xzf 'client handoff.tar.gz' -C unpacked-handoff 2> /dev/null || fail "the archive could not be extracted"
[ -f 'unpacked-handoff/client handoff/.notes' ] || fail "the hidden file is missing from the archive"
[ -d 'unpacked-handoff/client handoff/exports' ] || fail "the empty folder is missing from the archive"

diff -r reference-copy 'client handoff' > /dev/null || fail "the folder was changed by solution.sh"
