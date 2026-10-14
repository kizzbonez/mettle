# Dates on expires lines and on lines whose names only start with expires.
{
  printf 'expires=01/07/2027\n'
  printf 'renewed=01/07/2026\n'
  printf 'expires_note=see 02/03/2027\n'
  printf 'expires=2027-01-01\n'
  printf 'name=Cafe screen\n'
  printf 'expires=28/02/2028\n'
} > cafe.conf

bash solution.sh cafe.conf > /dev/null || fail "solution.sh exited with a non-zero status"

expected='expires=2027-07-01
renewed=01/07/2026
expires_note=see 02/03/2027
expires=2027-01-01
name=Cafe screen
expires=2028-02-28'
assert_eq "$(cat cafe.conf)" "$expected" "which dates are rewritten, and the order of year, month and day"
