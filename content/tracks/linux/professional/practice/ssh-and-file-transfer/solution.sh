#!/usr/bin/env bash
# Usage: bash solution.sh CONFIG HOST
# Prints the hostname, user, port and proxyjump that ssh would use for HOST.
set -u

config=$1
host=$2

# The first value found for each keyword in a block that applies to $host.
hostname=''
user=''
port=''
proxyjump=''

# 1. Read CONFIG line by line: keyword and value, Host blocks, first value wins.
applies=1   # lines before the first Host apply to every host
while IFS= read -r line || [ -n "$line" ]; do
  line=${line#"${line%%[![:space:]]*}"}
  [[ -z $line || $line == '#'* ]] && continue
  [[ $line =~ ^([A-Za-z]+)[[:space:]]*(=[[:space:]]*|[[:space:]]+)(.*)$ ]] || continue
  keyword=${BASH_REMATCH[1],,}
  value=${BASH_REMATCH[3]}

  if [[ $keyword == host ]]; then
    read -ra patterns <<< "$value"
    matched=0
    negated=0
    for pattern in "${patterns[@]}"; do
      if [[ $pattern == '!'* ]]; then
        [[ $host == ${pattern#!} ]] && negated=1
      elif [[ $host == $pattern ]]; then
        matched=1
      fi
    done
    applies=$(( matched && !negated ))
    continue
  fi

  (( applies )) || continue
  word=${value%%[[:space:]]*}
  case $keyword in
    hostname) [ -z "$hostname" ] && hostname=$word ;;
    user) [ -z "$user" ] && user=$word ;;
    port) [ -z "$port" ] && port=$word ;;
    proxyjump) [ -z "$proxyjump" ] && proxyjump=$word ;;
  esac
done < "$config"

# 2. Replace %h, fill in the defaults and print the four lines.
hostname=${hostname:-$host}
hostname=${hostname//%h/$host}
echo "hostname $hostname"
echo "user ${user:-none}"
echo "port ${port:-22}"
echo "proxyjump ${proxyjump:-none}"
