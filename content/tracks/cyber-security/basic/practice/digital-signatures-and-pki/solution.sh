#!/usr/bin/env bash
# Usage: bash solution.sh PUBKEY FILE...
# Checks each release FILE against its signature FILE.sig with the publisher's public key.
#
# The structure is written. Replace each "false" marked YOUR CODE with a command whose exit
# status gives the answer: "if COMMAND; then" runs the next lines when COMMAND succeeds (status 0).
set -u

pubkey=$1
shift                  # drop PUBKEY: "$@" is now the list of FILE arguments

# 1. The key. YOUR CODE: replace "false" with a test that succeeds when the key is unusable:
#    the file contains PRIVATE KEY, or openssl pkey cannot read it as a public key.
#    "A || B" succeeds when A or B succeeds; "! COMMAND" turns success into failure and back.
if grep -q 'PRIVATE KEY' "$pubkey" 2>/dev/null || ! openssl pkey -pubin -in "$pubkey" -noout >/dev/null 2>&1; then
  echo "KEY UNUSABLE"
  exit 2
fi

status=0
for file in "$@"; do   # each FILE in turn, spaces in its name kept
  # [ -f NAME ] succeeds when NAME is an existing file; "!" turns that around.
  if [ ! -f "$file" ]; then
    result=MISSING
  elif [ ! -f "$file.sig" ]; then
    result=UNSIGNED
  elif openssl dgst -sha256 -verify "$pubkey" -signature "$file.sig" "$file" >/dev/null 2>&1; then
    result=OK
  else
    result=BAD-SIGNATURE
  fi
  echo "$file $result"
  if [ "$result" != OK ]; then
    status=1
  fi
done
exit "$status"
