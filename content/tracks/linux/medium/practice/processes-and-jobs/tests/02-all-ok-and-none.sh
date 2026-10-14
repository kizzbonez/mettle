# Three jobs that succeed, and print on both standard output and standard error.
mkdir -p quiet-jobs
for name in mail stock invoices; do
  printf 'echo "%s done"\necho "%s warning" >&2\nexit 0\n' "$name" "$name" > "quiet-jobs/$name.sh"
done

actual=$(bash solution.sh quiet-jobs/mail.sh quiet-jobs/stock.sh quiet-jobs/invoices.sh 2> err.txt)
status=$?
assert_eq "$actual" 'ok: 3
failed: 0
worst: 0' "the summary when every job succeeds"
assert_eq "$status" "0" "exit status when every job succeeds"
assert_eq "$(cat err.txt)" "" "standard error of solution.sh: the jobs' own errors must be hidden"

# No jobs at all.
actual=$(bash solution.sh 2> /dev/null)
status=$?
assert_eq "$actual" 'ok: 0
failed: 0
worst: 0' "the summary when no job is given"
assert_eq "$status" "0" "exit status when no job is given"
