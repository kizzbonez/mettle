#!/usr/bin/env bash
# Usage: bash solution.sh PASSWD GROUP USER
# Prints what `id USER` would print, read from copies of /etc/passwd and /etc/group.
set -u

passwd_file=$1
group_file=$2
user=$3

# 1. Find the line of PASSWD whose first field is exactly $user. If there is none,
#    print "id: '<user>': no such user" on standard error and exit with status 1.
# YOUR CODE

# 2. Print "uid=UID(USER) gid=GID(NAME) groups=LIST": the primary group first, then every
#    group whose member list contains $user, in the order of GROUP, without repeats.
# YOUR CODE
