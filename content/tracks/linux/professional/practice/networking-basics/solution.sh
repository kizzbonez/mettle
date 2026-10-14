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
  name=${name%%@*}
  for cidr in $addresses; do
    case $cidr in
      *:*) continue ;;
    esac
    ip=${cidr%/*}
    prefix=${cidr#*/}
    IFS=. read -r a b c d <<< "$ip"
    addr=$(( (a << 24) | (b << 16) | (c << 8) | d ))
    mask=$(( (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF ))
    net=$(( addr & mask ))

    if (( a == 127 )); then
      class=loopback
    elif (( a == 169 && b == 254 )); then
      class=link-local
    elif (( a == 10 || (a == 172 && b >= 16 && b <= 31) || (a == 192 && b == 168) )); then
      class=private
    else
      class=public
    fi
    echo "$name $cidr network $(to_ip "$net")/$prefix $class"
  done
done < "$file"
