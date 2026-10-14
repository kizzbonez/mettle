#!/usr/bin/env bash
# parts: price a parts order sheet for the co-op.
# Run as: bash solution.sh ORDER
# Other scripts may also source this file to reuse its functions.

# die MESSAGE: print "parts: MESSAGE" on standard error and exit with status 1.
die() {
  # YOUR CODE
  :
}

# is_part_code CODE: succeed (status 0) when CODE is three capital letters, a dash
# and four digits, such as BRK-0042, and fail (status 1) otherwise. Print nothing.
is_part_code() {
  # YOUR CODE
  :
}

# line_cost QTY UNIT: print QTY times UNIT, both whole numbers of cents.
line_cost() {
  # YOUR CODE
  :
}

# cents_to_euros CENTS: print a whole number of cents as euros with two decimals.
cents_to_euros() {
  # YOUR CODE
  :
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

# YOUR CODE: run main with the script's arguments only when this file is executed,
# not when another script sources it.
main "$@"
