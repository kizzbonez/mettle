#!/usr/bin/env bash
# Usage: bash solution.sh LOG
# Reads an authentication log and prints one line for each AAA event in it.
#
# Most of this script is already written. Change only the part marked YOUR CODE.
set -u

log=$1

# Read the log one line at a time.
while IFS= read -r line; do
  # Every line starts with five words: month, day, clock time, host and program.
  # "read" puts them in five variables and everything after them in "rest".
  read -r month day clock host program rest <<< "$line"

  case $program in
    sshd*)
      # sshd lines are AUTHENTICATION: did the person prove who they are?
      user=${line#* for }          # keep the text after " for "
      user=${user#invalid user }   # "for invalid user admin" means the name tried was admin
      user=${user%% *}             # stop at the next space: only the user name is left
      if [[ $line == *"Accepted "* ]]; then
        echo "authentication success $user"
      elif [[ $line == *"Failed "* ]]; then
        echo "authentication failure $user"
      fi
      ;;
    sudo:)
      # sudo lines look like this:
      #   sudo:     maya : TTY=pts/0 ; PWD=/home/maya ; USER=root ; COMMAND=/usr/bin/apt upgrade
      user=${rest%% *}             # the first word after "sudo:" is the user
      command=${line#*COMMAND=}    # everything after "COMMAND=" is the command they asked for

      # YOUR CODE: print one line for this sudo line, using the rules in the instructions.
      # Copy the way the sshd part above tests a line: [[ $line == *"some text"* ]]
      # Check the rules in the order the instructions give them.
      ;;
  esac
done < "$log"
