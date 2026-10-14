#!/usr/bin/env bash
# Usage: bash solution.sh UNIT_FILE
# Reviews one service unit and prints its problems, or "no problems found".
# Exits with status 1 if there was a problem, 0 if not.
set -u

unit_file=$1

# 1. Read the sections and the settings ExecStart, User and Restart ([Service])
#    and WantedBy ([Install]) the way systemd does.
# 2. Print the problems in the order of the instructions, or "no problems found".
# 3. Exit with status 1 if there was a problem.
# YOUR CODE
