#!/usr/bin/env bash
# Usage: bash solution.sh CSR DOMAIN
# Checks a certificate signing request against the university CA's issuance policy.
#
# The structure is written. Fill in the four places marked YOUR CODE.
# "if COMMAND; then" runs the next lines when COMMAND succeeds (exit status 0).
set -u

csr=$1
domain=${2,,}          # ${2,,} is the second argument in lower case

# 1. A valid CSR. YOUR CODE: replace "false" with a pipeline that succeeds when the output of
#    openssl req -in "$csr" -noout -verify (both streams: add 2>&1) does NOT contain "verify OK".
#    "! COMMAND" turns success into failure and back.
if ! openssl req -in "$csr" -noout -verify 2>&1 | grep -q 'verify OK'; then
  echo "INVALID-CSR"
  exit 2
fi

text=$(openssl req -in "$csr" -noout -text)      # the whole CSR as text, as in the lesson
findings=()                                      # the findings; add one with findings+=("TEXT")

# 2. YOUR CODE: replace "echo" with a pipeline that prints only the line AFTER
#    "X509v3 Subject Alternative Name" in $text. Start it with: printf '%s\n' "$text" |
san=$(printf '%s\n' "$text" | grep -A1 'X509v3 Subject Alternative Name' | tail -n 1)

# The DNS names on that line, in lower case, one per element of the array "names" (written):
#   tr puts each entry on its own line, sed keeps only "DNS:" entries without the prefix.
mapfile -t names < <(printf '%s\n' "$san" | tr ',' '\n' | sed -n 's/^ *DNS://p' | tr 'A-Z' 'a-z')

if [ "${#names[@]}" -eq 0 ]; then                # ${#names[@]} is the number of names
  findings+=("NO-SAN")
fi
for name in "${names[@]}"; do
  if [[ $name == '*.'* ]]; then                  # the name starts with "*."
    findings+=("WILDCARD $name")
  # 3. YOUR CODE: an "elif" that adds "OUTSIDE-DOMAIN $name" when the name is not "$domain"
  #    and does not end with ".$domain".
  elif [[ $name != "$domain" && $name != *".$domain" ]]; then
    findings+=("OUTSIDE-DOMAIN $name")
  fi
done

# The key type and size (written): RSA needs 2048 bits, an elliptic curve 256, others 0.
bits=$(printf '%s\n' "$text" | sed -n 's/^ *Public-Key: (\([0-9]*\) bit)$/\1/p')
minimum=0
if printf '%s\n' "$text" | grep -q 'Public Key Algorithm: rsaEncryption'; then
  minimum=2048
elif printf '%s\n' "$text" | grep -q 'Public Key Algorithm: id-ecPublicKey'; then
  minimum=256
fi
# 4. YOUR CODE: add "WEAK-KEY" when $bits is not empty and is less than $minimum.
if [ -n "$bits" ] && [ "$bits" -lt "$minimum" ]; then
  findings+=("WEAK-KEY")
fi

# Print the findings, one per line, and exit 1; or print OK and exit 0.
if [ "${#findings[@]}" -eq 0 ]; then
  echo "OK"
  exit 0
fi
printf '%s\n' "${findings[@]}"
exit 1
