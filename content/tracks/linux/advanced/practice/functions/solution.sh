#!/usr/bin/env bash
# parts: price a parts order sheet for the co-op.
# Run as: bash solution.sh ORDER
# Other scripts may also source this file to reuse its functions.

# die MESSAGE: print "parts: MESSAGE" on standard error and exit with status 1.
die() {
  printf 'parts: %s\n' "$1" >&2
  exit 1
}

# is_part_code CODE: succeed (status 0) when CODE is three capital letters, a dash
# and four digits, such as BRK-0042, and fail (status 1) otherwise. Print nothing.
is_part_code() {
  [[ $1 =~ ^[A-Z]{3}-[0-9]{4}$ ]]
}

# line_cost QTY UNIT: print QTY times UNIT, both whole numbers of cents.
line_cost() {
  local qty=$1 unit=$2
  printf '%s\n' "$((qty * unit))"
}

# cents_to_euros CENTS: print a whole number of cents as euros with two decimals.
cents_to_euros() {
  local cents=$1
  printf '%d.%02d\n' "$((cents / 100))" "$((cents % 100))"
}

# main ORDER: price every line of ORDER and print the total. Leave it as it is.
main() {
  local order=$1 code qty unit cost total=0
  [[ -r $order ]] || die "cannot read $order"
  while read -r code qty unit; do
    if ! is_part_code "$code"; then
      printf 'parts: skipping unknown part code %s\n' "$code" >&2
      continue
    fi
    cost=$(line_cost "$qty" "$unit")
    total=$((total + cost))
    printf '%s %s x %s = %s\n' "$code" "$qty" "$(cents_to_euros "$unit")" "$(cents_to_euros "$cost")"
  done < "$order"
  printf 'total %s\n' "$(cents_to_euros "$total")"
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
