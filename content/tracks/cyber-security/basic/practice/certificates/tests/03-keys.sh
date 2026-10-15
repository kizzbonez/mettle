# Key sizes: RSA needs 2048 bits, elliptic curves 256; other key types are never weak.
check_key() {
  openssl req -new -newkey "$2" ${3:+-pkeyopt "$3"} -nodes -keyout "t3-$1.key" -out "t3-$1.csr" \
    -subj "/CN=$1.fenwick.test" -addext "subjectAltName=DNS:$1.fenwick.test" 2>/dev/null || fail "test setup: CSR $1"
  bash solution.sh "t3-$1.csr" fenwick.test
}

assert_eq "$(check_key rsa2048 rsa:2048)" "OK" "an RSA key of 2048 bits is strong enough"
assert_eq "$(check_key rsa1024 rsa:1024)" "WEAK-KEY" "an RSA key of 1024 bits is weak"
assert_eq "$(check_key p224 ec ec_paramgen_curve:P-224)" "WEAK-KEY" "an elliptic-curve key of 224 bits is weak"
assert_eq "$(check_key p256 ec ec_paramgen_curve:P-256)" "OK" "an elliptic-curve key of 256 bits is strong enough"
assert_eq "$(check_key p384 ec ec_paramgen_curve:P-384)" "OK" "an elliptic-curve key of 384 bits is strong enough"
assert_eq "$(check_key ed25519 ed25519)" "OK" "an Ed25519 key is never weak"
