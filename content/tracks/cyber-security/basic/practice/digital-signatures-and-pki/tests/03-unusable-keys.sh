# The key given must be a public key; anything else stops the script before any file is checked.
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out t3-signing.key 2>/dev/null || fail "test setup: key generation"
openssl pkey -in t3-signing.key -pubout -out t3-signing.pub || fail "test setup: public key"
printf 'release 2.4.2\n' > t3-notes.txt
openssl dgst -sha256 -sign t3-signing.key -out t3-notes.txt.sig t3-notes.txt || fail "test setup: signing"
printf 'publisher key: ask Jo on the forum\n' > t3-note-about-key.txt

for key in t3-signing.key t3-note-about-key.txt t3-no-such-key.pub; do
  actual=$(bash solution.sh "$key" t3-notes.txt)
  status=$?
  assert_eq "$actual" "KEY UNUSABLE" "output when the key file ($key) is not a usable public key"
  assert_eq "$status" "2" "exit status when the key file ($key) is not a usable public key"
done

actual=$(bash solution.sh t3-signing.pub t3-notes.txt)
assert_eq "$actual" "t3-notes.txt OK" "the matching public key verifies the file"
