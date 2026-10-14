#!/usr/bin/env bash
# takes: suggest a tidy name for every recorded take in a list, and count them by type.
# Run as: [PREFIX=TEXT] bash solution.sh LIST

list=${1:?usage: solution.sh LIST}

mapfile -t paths < "$list"

declare -A count=()

for path in "${paths[@]}"; do
  [[ -n $path ]] || continue
  name=${path##*/}
  if [[ $name == *.* ]]; then
    stem=${name%.*}
    ext=${name##*.}
    ext=${ext,,}
  else
    stem=$name
    ext=""
  fi
  new=${stem// /_}
  new=${new,,}
  if [[ -n $ext ]]; then
    new="$new.$ext"
  fi
  new="${PREFIX:+$PREFIX-}$new"
  printf '%s -> %s\n' "$name" "$new"
  key=${ext:-(none)}
  count[$key]=$(( ${count[$key]:-0} + 1 ))
done

for ext in "${!count[@]}"; do
  printf '%s: %s\n' "$ext" "${count[$ext]}"
done | sort
