touch a.pdf
mkdir -p adir
usage_text='Usage: lpjob [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...
  -c COPIES   copies of each file, 1 to 99 (default 1)
  -s SIDES    print on one or two sides (default one)
  -p PRINTER  the printer to use (default front-desk)
  -n          dry run: show the jobs but queue nothing
  -h          show this help and exit'

out=$(bash solution.sh -h 2> err.txt)
assert_eq "$?" "0" "exit status of -h"
assert_eq "$out" "$usage_text" "-h prints the usage on standard output"
assert_eq "$(cat err.txt)" "" "-h prints nothing on standard error"

out=$(bash solution.sh -c 2 -h a.pdf 2> err.txt)
assert_eq "$?" "0" "exit status of -h after another option"
assert_eq "$out" "$usage_text" "-h after another option prints the usage on standard output"

# check_unreadable DESCRIPTION BAD_FILE ARGS...
check_unreadable() {
  local what=$1 bad=$2 out status
  shift 2
  out=$(bash solution.sh "$@" 2> err.txt)
  status=$?
  assert_eq "$status" "1" "$what: exit status"
  assert_eq "$out" "" "$what: nothing is printed on standard output, not even for the good files"
  assert_eq "$(cat err.txt)" "lpjob: cannot read $bad" "$what: the message on standard error"
}

check_unreadable "a missing file after a good one" missing.pdf a.pdf missing.pdf
check_unreadable "a missing file with a space in its name" "q4 draft.pdf" -n "q4 draft.pdf" a.pdf
check_unreadable "a directory given as FILE" adir -s two adir
check_unreadable "an option written after the first FILE" -c a.pdf -c 2
