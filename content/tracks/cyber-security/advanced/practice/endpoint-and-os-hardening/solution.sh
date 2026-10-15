#!/usr/bin/env bash
# Usage: bash solution.sh BASELINE DIR
# Compares the kernel settings the *.conf files in DIR apply (last value wins) with a baseline.
set -u
export LC_ALL=C
shopt -s nullglob

baseline=$1
dir=$2

declare -A value=()    # key -> the last value set
declare -A origin=()   # key -> the file name that set it

trim() {
  local text=$1
  text=${text#"${text%%[![:space:]]*}"}
  text=${text%"${text##*[![:space:]]}"}
  printf '%s' "$text"
}

# 1. Every *.conf file in DIR, in byte order of names; a later value overrides an earlier one.
#    Skip blank lines, # and ; comments, and lines without "=". Trim spaces and tabs, drop a
#    leading "-" from the key and turn "/" into ".".
for file in "$dir"/*.conf; do
  [ -f "$file" ] || continue
  while IFS= read -r line || [ -n "$line" ]; do
    line=$(trim "$line")
    case $line in
      '' | '#'* | ';'*) continue ;;
      *=*) ;;
      *) continue ;;
    esac
    key=$(trim "${line%%=*}")
    key=${key#-}
    key=${key//\//.}
    value[$key]=$(trim "${line#*=}")
    origin[$key]=${file##*/}
  done < "$file"
done

# 2. For each "KEY WANT DEFAULT" line of the baseline: the effective value and its source
#    (a file name or "default"), then
#    STATUS KEY VALUE (SOURCE; baseline WANT)
#    Exit 1 if any check failed.
fails=0
while read -r key want default; do
  case $key in
    '' | '#'*) continue ;;
  esac
  if [ -n "${value[$key]+set}" ]; then
    current=${value[$key]}
    from=${origin[$key]}
  else
    current=$default
    from=default
  fi
  if [ "$current" = "$want" ]; then
    status=PASS
  else
    status=FAIL
    fails=$(( fails + 1 ))
  fi
  echo "$status $key $current ($from; baseline $want)"
done < "$baseline"

[ "$fails" -eq 0 ]
