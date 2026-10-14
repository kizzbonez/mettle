#!/usr/bin/env bash
# album-report: count the .jpg photos in each album (subdirectory) of DIR.
# Run as: bash solution.sh DIR
set -euo pipefail

# count_photos ALBUM: print how many regular .jpg files are directly in ALBUM.
count_photos() {
  local n=0 f
  for f in "$1"/*.jpg; do
    if [[ -f $f ]]; then
      n=$((n + 1))
    fi
  done
  echo "$n"
}

main() {
  local dir=$1 album count total=0
  if ! cd -- "$dir" 2> /dev/null; then
    echo "album-report: cannot enter $dir" >&2
    exit 1
  fi

  if [[ ${ALBUM_TRACE:-} == 1 ]]; then
    PS4='+ ${LINENO}:${FUNCNAME[0]:-main}: '
    set -x
  fi

  for album in *; do
    if [[ -d $album ]]; then
      count=$(count_photos "$album")
      echo "$album: $count photos"
      total=$((total + count))
    fi
  done
  echo "total: $total photos"
}

main "$@"
