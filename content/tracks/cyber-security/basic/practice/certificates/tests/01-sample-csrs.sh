# The three CSRs in data/, checked for the domain fenwick.test.
actual=$(bash solution.sh data/gradebook.csr fenwick.test)
status=$?
assert_eq "$actual" "OK" "output for data/gradebook.csr"
assert_eq "$status" "0" "exit status for a CSR that meets the policy"

actual=$(bash solution.sh data/printhub.csr fenwick.test)
status=$?
assert_eq "$actual" "WILDCARD *.print.fenwick.test
OUTSIDE-DOMAIN printhub.fenwick-print.test
WEAK-KEY" "findings for data/printhub.csr, in the order of the instructions"
assert_eq "$status" "1" "exit status for a CSR with findings"

actual=$(bash solution.sh data/library.csr fenwick.test)
status=$?
assert_eq "$actual" "NO-SAN" "findings for data/library.csr"
assert_eq "$status" "1" "exit status for a CSR with findings"
