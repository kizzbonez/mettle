# Signatures made with another key, or that are not signatures at all, are BAD-SIGNATURE.
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out t2-publisher.key 2>/dev/null || fail "test setup: key generation"
openssl pkey -in t2-publisher.key -pubout -out t2-publisher.pub || fail "test setup: public key"
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out t2-attacker.key 2>/dev/null || fail "test setup: key generation"
mkdir -p t2
printf 'skylark 2.4.1 hotfix\n' > t2/hotfix.txt
printf 'board=C\n' > t2/board.conf
printf 'empty release note\n' > t2/empty.txt
openssl dgst -sha256 -sign t2-attacker.key -out t2/hotfix.txt.sig t2/hotfix.txt || fail "test setup: signing"
printf 'not a signature\n' > t2/board.conf.sig
: > t2/empty.txt.sig

actual=$(bash solution.sh t2-publisher.pub t2/hotfix.txt t2/board.conf t2/empty.txt)
status=$?
assert_eq "$actual" "t2/hotfix.txt BAD-SIGNATURE
t2/board.conf BAD-SIGNATURE
t2/empty.txt BAD-SIGNATURE" "a signature from another key, a text file and an empty file are all bad signatures"
assert_eq "$status" "1" "exit status when signatures are bad"

openssl dgst -sha256 -sign t2-publisher.key -out t2/hotfix.txt.sig t2/hotfix.txt || fail "test setup: signing"
openssl dgst -sha256 -sign t2-publisher.key -out t2/board.conf.sig t2/board.conf || fail "test setup: signing"
actual=$(bash solution.sh t2-publisher.pub t2/hotfix.txt t2/board.conf)
status=$?
assert_eq "$actual" "t2/hotfix.txt OK
t2/board.conf OK" "files signed by the publisher, with nothing from openssl in the output"
assert_eq "$status" "0" "exit status when every file is OK"
