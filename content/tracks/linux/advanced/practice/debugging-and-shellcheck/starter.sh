#!/usr/bin/env bash
# album-report: count the .jpg photos in each album (subdirectory) of DIR.
# Run as: bash solution.sh DIR
# It works on simple names only. Run "shellcheck solution.sh" and fix what it finds.

# count_photos ALBUM: print how many regular .jpg files are directly in ALBUM.
count_photos() {
  local n=0
  for f in $(ls $1); do
    if [[ $f == *.jpg ]]; then
      n=$((n + 1))
    fi
  done
  echo $n
}

main() {
  dir=$1
  cd $dir
  if [ $? -ne 0 ]; then
    echo "album-report: cannot enter $dir" >&2
    exit 1
  fi

  # YOUR CODE: when ALBUM_TRACE is 1, set PS4 and turn on tracing here.

  total=0
  for album in $(ls); do
    if [ -d $album ]; then
      local count=$(count_photos $album)
      echo "$album: $count photos"
      total=$((total + count))
    fi
  done
  echo "total: $total photos"
}

main $@
