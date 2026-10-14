# Several IDs on one line, the same ID many times, and empty lines.
{
  printf 'SEC-900 blocks REL-1200 and SEC-900 again\n'
  printf '\n'
  printf 'REL-1200\n'
  printf 'nothing here\n'
  printf '\n'
  printf 'APP-556 then APP-555 then APP-556\n'
} > notes-week-9.txt

expected='APP-555
APP-556
REL-1200
SEC-900
lines without a ticket: 3'

actual=$(bash solution.sh notes-week-9.txt) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "lines with several IDs, IDs repeated across the file, and empty lines"
