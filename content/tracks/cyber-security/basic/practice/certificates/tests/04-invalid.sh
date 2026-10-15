# Files that are not valid CSRs stop the check with INVALID-CSR and status 2.
openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout t4.key -out t4-good.csr \
  -subj "/O=Fenwick University/CN=vpn.fenwick.test" -addext "subjectAltName=DNS:vpn.fenwick.test" 2>/dev/null || fail "test setup: CSR"
openssl req -in t4-good.csr -outform DER -out t4-good.der || fail "test setup: DER"
LC_ALL=C sed 's/Fenwick University/Fenwick Universitz/' t4-good.der > t4-changed.der
openssl req -inform DER -in t4-changed.der -out t4-changed.csr || fail "test setup: changed CSR"
openssl req -x509 -new -key t4.key -out t4-cert.pem -days 30 -subj "/CN=vpn.fenwick.test" 2>/dev/null || fail "test setup: certificate"
printf 'Please sign: vpn.fenwick.test\n' > t4-note.txt

for file in t4-changed.csr t4-cert.pem t4-note.txt t4-missing.csr; do
  actual=$(bash solution.sh "$file" fenwick.test 2>/dev/null)
  status=$?
  assert_eq "$actual" "INVALID-CSR" "output for $file, which is not a valid CSR"
  assert_eq "$status" "2" "exit status for $file, which is not a valid CSR"
done

actual=$(bash solution.sh t4-good.csr fenwick.test)
assert_eq "$actual" "OK" "the unchanged CSR is valid and meets the policy"
