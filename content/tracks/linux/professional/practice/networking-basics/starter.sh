#!/usr/bin/env bash
# Usage: bash solution.sh FILE
# FILE is the output of `ip -br address`. Prints one line per IPv4 address:
# "NAME ADDRESS/PREFIX network NETWORK/PREFIX CLASS".
set -u

file=$1

# to_ip NUMBER: print a 32-bit number as a dotted IPv4 address.
to_ip() {
  echo "$(( $1 >> 24 & 255 )).$(( $1 >> 16 & 255 )).$(( $1 >> 8 & 255 )).$(( $1 & 255 ))"
}

while read -r name state addresses; do
  # For each IPv4 address in $addresses: work out its network and its class, and print the line.
  # YOUR CODE
  :
done < "$file"
