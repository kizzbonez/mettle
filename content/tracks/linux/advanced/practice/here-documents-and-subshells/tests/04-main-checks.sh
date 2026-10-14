mkdir -p site4 bare
touch site4/index.html bare/readme.txt

# check_bad_target DESCRIPTION TARGET
check_bad_target() {
  local what=$1 out status
  out=$(bash solution.sh "$2" site4 2> err.txt)
  status=$?
  assert_eq "$status" "2" "$what: exit status"
  assert_eq "$out" "" "$what: nothing on standard output"
  assert_eq "$(cat err.txt)" "vhost: expected HOST:PORT, not '$2'" "$what: the message on standard error"
}
check_bad_target "a target without a port" bad.example
check_bad_target "a port that is not a number" bad.example:http
check_bad_target "a target without a host" :8080
check_bad_target "a target with two colons" bad.example:80:81
[[ ! -e bad.example.conf ]] || fail "no HOST.conf is written for a bad HOST:PORT"

out=$(bash solution.sh missing.example:8080 nope 2> err.txt)
assert_eq "$?" "1" "exit status for a ROOT that does not exist"
assert_eq "$(cat err.txt)" "vhost: not a directory: nope" "the message for a ROOT that does not exist"
[[ ! -e missing.example.conf ]] || fail "no HOST.conf is written when ROOT does not exist"

out=$(bash solution.sh bare.test:3000 bare)
assert_eq "$?" "0" "exit status for a site without pages"
assert_eq "$out" "wrote bare.test.conf for 0 pages" "the output for a site without pages"
grep -qxF '        proxy_pass http://127.0.0.1:3001;' bare.test.conf \
  || fail "the proxy_pass line of the server block written for bare.test:3000"

# Running again replaces the file instead of adding to it.
bash solution.sh twice.test:8000 site4 > /dev/null
bash solution.sh twice.test:8000 site4 > /dev/null
assert_eq "$(grep -c '^server {$' twice.test.conf)" "1" "HOST.conf holds one server block after two runs"
[[ ! -e site4/twice.test.conf ]] || fail "HOST.conf is written in the current directory, not in ROOT"
