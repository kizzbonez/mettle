touch a.pdf
usage_line='Usage: lpjob [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...'

# check_usage_error DESCRIPTION ARGS...
check_usage_error() {
  local what=$1 out status
  shift
  out=$(bash solution.sh "$@" 2> err.txt)
  status=$?
  assert_eq "$status" "2" "$what: exit status for incorrect usage"
  assert_eq "$out" "" "$what: nothing on standard output"
  [[ $(head -n 1 err.txt) == "lpjob: "?* ]] \
    || fail "$what: the first line on standard error is 'lpjob: REASON'"
  grep -qxF -- "$usage_line" err.txt || fail "$what: the usage is printed on standard error"
}

# check_reason DESCRIPTION REASON ARGS...: the first line must be exactly "lpjob: REASON".
check_reason() {
  local what=$1 reason=$2
  shift 2
  check_usage_error "$what" "$@"
  assert_eq "$(head -n 1 err.txt)" "lpjob: $reason" "$what: the reason on the first line"
}

check_reason "an unknown option" "unknown option -q" -q a.pdf
check_reason "an unknown option among good ones" "unknown option -Z" -n -c 2 -Z a.pdf
check_reason "-c at the very end" "option -c needs a value" -n -c
check_reason "-s at the very end" "option -s needs a value" -s
check_reason "-p at the very end" "option -p needs a value" -c 3 -p

check_usage_error "COPIES of 0" -c 0 a.pdf
check_usage_error "COPIES of 100" -c 100 a.pdf
check_usage_error "COPIES written as a word" -c two a.pdf
check_usage_error "COPIES with a decimal point" -c 1.5 a.pdf
check_usage_error "a negative COPIES" -c -3 a.pdf
check_usage_error "an empty COPIES" -c '' a.pdf
check_usage_error "SIDES of three" -s three a.pdf
check_usage_error "SIDES in capitals" -s ONE a.pdf
check_usage_error "an empty SIDES" -s '' a.pdf
check_usage_error "an empty PRINTER" -p '' a.pdf
check_usage_error "no arguments"
check_usage_error "options but no FILE" -n -c 2
check_usage_error "only --" --
check_usage_error "a bad COPIES together with a missing FILE" -c 0 missing.pdf
