#!/usr/bin/env bash
# Usage: bash solution.sh DIR BASELINE
# Compares the setuid and setgid files under DIR with a saved list of "MODE PATH" lines.
set -u

dir=$1
baseline=$2

# 1. The setuid and setgid files under $dir now, with their modes.
declare -A now
while read -r mode path; do
  now[$path]=$mode
done < <(find "$dir" -type f -perm /6000 -printf '%m %p\n')

# 2. The files and modes in $baseline (skip empty lines and comments).
declare -A before
while read -r mode path; do
  case $mode in
    '' | '#'*) continue ;;
  esac
  before[$path]=$mode
done < "$baseline"

# 3. Print the new, changed and gone files, each group sorted by path in byte order.
#    Print "no changes" and exit 0 if there are none; otherwise exit 1.
mapfile -t paths < <(
  {
    for path in "${!now[@]}"; do echo "$path"; done
    for path in "${!before[@]}"; do echo "$path"; done
  } | LC_ALL=C sort -u
)

changes=0
for path in "${paths[@]}"; do
  if [ -n "${now[$path]+set}" ] && [ -z "${before[$path]+set}" ]; then
    echo "new: $path (${now[$path]})"
    changes=$(( changes + 1 ))
  fi
done
for path in "${paths[@]}"; do
  if [ -n "${now[$path]+set}" ] && [ -n "${before[$path]+set}" ] && [ "${now[$path]}" != "${before[$path]}" ]; then
    echo "changed: $path (${before[$path]} -> ${now[$path]})"
    changes=$(( changes + 1 ))
  fi
done
for path in "${paths[@]}"; do
  if [ -z "${now[$path]+set}" ] && [ -n "${before[$path]+set}" ]; then
    echo "gone: $path"
    changes=$(( changes + 1 ))
  fi
done

if [ "$changes" -eq 0 ]; then
  echo "no changes"
  exit 0
fi
exit 1
