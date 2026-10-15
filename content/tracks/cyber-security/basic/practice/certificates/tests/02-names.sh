# SAN names: case, the domain itself, look-alike suffixes, wildcards outside the domain, other entry types.
make_csr() {
  openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout "$1.key" -out "$1.csr" \
    -subj "/O=Fenwick University/CN=$2" ${3:+-addext "subjectAltName=$3"} 2>/dev/null || fail "test setup: CSR $1"
}

make_csr t2-mixed wiki.fenwick.test "DNS:Wiki.Fenwick.TEST,DNS:fenwick.test,DNS:notfenwick.test,DNS:fenwick.test.example.test,DNS:a.b.fenwick.test,IP:10.0.0.1,email:it@fenwick.test"
actual=$(bash solution.sh t2-mixed.csr Fenwick.Test)
status=$?
assert_eq "$actual" "OUTSIDE-DOMAIN notfenwick.test
OUTSIDE-DOMAIN fenwick.test.example.test" \
  "names are compared in lower case, the domain itself and its subdomains are inside, look-alike names are outside, other entry types are ignored"
assert_eq "$status" "1" "exit status with OUTSIDE-DOMAIN findings"

make_csr t2-wild "*.labs.example.test" "DNS:*.labs.example.test,DNS:*.FENWICK.test"
actual=$(bash solution.sh t2-wild.csr fenwick.test)
assert_eq "$actual" "WILDCARD *.labs.example.test
WILDCARD *.fenwick.test" "a wildcard name gives only a WILDCARD finding, inside or outside the domain"

make_csr t2-iponly printer.fenwick.test "IP:10.20.0.16"
actual=$(bash solution.sh t2-iponly.csr fenwick.test)
assert_eq "$actual" "NO-SAN" "a SAN extension with no DNS name counts as no SAN"

make_csr t2-cn-only cn-only.fenwick.test ""
actual=$(bash solution.sh t2-cn-only.csr fenwick.test)
assert_eq "$actual" "NO-SAN" "the common name is never used in place of a SAN"
