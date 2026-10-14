#!/usr/bin/env bash
# vhost: write an nginx server block for a client's site and list the site's pages.
# Run as: bash solution.sh HOST:PORT ROOT
# The tests also source this file to call render_conf and list_pages on their own.
set -euo pipefail

# die MESSAGE [STATUS]: print "vhost: MESSAGE" on standard error and exit (status 1 by default).
die() {
  printf 'vhost: %s\n' "$1" >&2
  exit "${2:-1}"
}

# render_conf HOST PORT ROOT: print the server block from the instructions, using one
# here-document.
render_conf() {
  local host=$1 port=$2 root=$3
  # YOUR CODE
}

# list_pages ROOT: print every .html file below ROOT as a path relative to ROOT
# (./about.html), sorted with LC_ALL=C sort, without changing the caller's directory.
list_pages() {
  # YOUR CODE
  :
}

main() {
  local host="" port="" root=${2:-} page count=0

  # YOUR CODE: split $1 at the colon into host and port, using read and a here-string.

  if [[ -z $host || ! $port =~ ^[0-9]+$ ]]; then
    die "expected HOST:PORT, not '${1:-}'" 2
  fi
  [[ -d $root ]] || die "not a directory: $root"

  render_conf "$host" "$port" "$root" > "$host.conf"

  # YOUR CODE: read the output of list_pages line by line, print "page PATH" for each
  # page and count them, so that the count is still there after the loop.

  printf 'wrote %s.conf for %s pages\n' "$host" "$count"
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
