# File names with spaces, an RSA publisher key, and no files at all.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out t4-rsa.key 2>/dev/null || fail "test setup: key generation"
openssl pkey -in t4-rsa.key -pubout -out t4-rsa.pub || fail "test setup: public key"
mkdir -p "t4 release"
printf 'Release notes for the 2.5 beta\n' > "t4 release/release notes.txt"
printf 'beta=true\n' > "t4 release/beta config.conf"
openssl dgst -sha256 -sign t4-rsa.key -out "t4 release/release notes.txt.sig" "t4 release/release notes.txt" || fail "test setup: signing"
openssl dgst -sha256 -sign t4-rsa.key -out "t4 release/beta config.conf.sig" "t4 release/beta config.conf" || fail "test setup: signing"
printf 'beta=false\n' > "t4 release/beta config.conf"

actual=$(bash solution.sh t4-rsa.pub "t4 release/release notes.txt" "t4 release/beta config.conf" "t4 release/missing file.bin")
status=$?
assert_eq "$actual" "t4 release/release notes.txt OK
t4 release/beta config.conf BAD-SIGNATURE
t4 release/missing file.bin MISSING" "file names with spaces, signed with an RSA key"
assert_eq "$status" "1" "exit status when a file is not OK"

actual=$(bash solution.sh t4-rsa.pub)
status=$?
assert_eq "$actual" "" "no files given prints nothing"
assert_eq "$status" "0" "exit status when no files are given"
