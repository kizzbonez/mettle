#!/usr/bin/env bash
# Usage: bash solution.sh PASSWD GROUP USER
# Prints what `id USER` would print, read from copies of /etc/passwd and /etc/group.
set -u

passwd_file=$1
group_file=$2
user=$3

# 1. Find the line of PASSWD whose first field is exactly $user. If there is none,
#    print "id: '<user>': no such user" on standard error and exit with status 1.
line=$(awk -F: -v user="$user" '$1 == user { print; exit }' "$passwd_file")
if [ -z "$line" ]; then
  echo "id: '$user': no such user" >&2
  exit 1
fi
IFS=: read -r _ _ uid gid _ <<< "$line"

# 2. Print "uid=UID(USER) gid=GID(NAME) groups=LIST": the primary group first, then every
#    group whose member list contains $user, in the order of GROUP, without repeats.
awk -F: -v user="$user" -v uid="$uid" -v gid="$gid" '
  $3 == gid && primary == "" { primary = $3 "(" $1 ")" }
  $3 != gid {
    n = split($4, members, ",")
    for (i = 1; i <= n; i++) {
      if (members[i] == user) {
        extra = extra "," $3 "(" $1 ")"
        break
      }
    }
  }
  END { printf "uid=%s(%s) gid=%s groups=%s%s\n", uid, user, primary, primary, extra }
' "$group_file"
