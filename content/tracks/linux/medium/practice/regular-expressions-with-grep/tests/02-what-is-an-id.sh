# One candidate per line: letter and digit counts at and beyond the limits,
# lower case, and IDs glued to letters, digits or underscores.
{
  printf 'A-123\n'
  printf 'AB-123\n'
  printf 'ABCD-12345\n'
  printf 'ABCDE-123\n'
  printf 'AB-12\n'
  printf 'AB-123456\n'
  printf 'ab-123\n'
  printf 'Ab-123\n'
  printf 'xAB-123\n'
  printf 'AB-123x\n'
  printf 'AB-123_\n'
  printf '_AB-123\n'
  printf '9AB-127\n'
  printf 'see [AB-124] first\n'
  printf 'AB-125,AB-126\n'
} > candidates.txt

expected='AB-123
AB-124
AB-125
AB-126
ABCD-12345
lines without a ticket: 11'

actual=$(bash solution.sh candidates.txt) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "which strings are ticket IDs: letter and digit counts, case, and what may stand next to an ID"
