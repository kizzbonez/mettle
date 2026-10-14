touch a.pdf b.pdf -- -draft.pdf

# check_jobs DESCRIPTION EXPECTED ARGS...
check_jobs() {
  local what=$1 expected=$2 out status
  shift 2
  out=$(bash solution.sh "$@" 2> err.txt)
  status=$?
  assert_eq "$status" "0" "$what: exit status"
  assert_eq "$out" "$expected" "$what: the jobs printed"
  assert_eq "$(cat err.txt)" "" "$what: nothing on standard error"
}

check_jobs "no options at all" \
  "queued a.pdf (copies=1, sides=one, printer=front-desk)" \
  a.pdf
check_jobs "a value attached to its option (-c3)" \
  "queued a.pdf (copies=3, sides=one, printer=front-desk)" \
  -c3 a.pdf
check_jobs "combined options (-nc3 -stwo)" \
  "would queue a.pdf (copies=3, sides=two, printer=front-desk)
would queue b.pdf (copies=3, sides=two, printer=front-desk)" \
  -nc3 -stwo a.pdf b.pdf
check_jobs "a PRINTER value that starts with a dash (-p -n)" \
  "queued a.pdf (copies=1, sides=one, printer=-n)" \
  -p -n a.pdf
check_jobs "a FILE that starts with a dash, after --" \
  "queued -draft.pdf (copies=1, sides=one, printer=lab-2)" \
  -p lab-2 -- -draft.pdf
check_jobs "options given twice" \
  "queued b.pdf (copies=5, sides=one, printer=front-desk)" \
  -c 2 -s two -c 5 -s one b.pdf
check_jobs "the smallest and largest COPIES" \
  "queued a.pdf (copies=1, sides=two, printer=back-room)
queued b.pdf (copies=1, sides=two, printer=back-room)" \
  -c 1 -s two -p back-room a.pdf b.pdf
check_jobs "COPIES of 99" \
  "would queue a.pdf (copies=99, sides=one, printer=front-desk)" \
  -n -c 99 a.pdf
