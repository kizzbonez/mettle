# A job ended by the TERM signal, failures with statuses of different widths,
# and a job whose file name contains a space.
mkdir -p 'night jobs'
printf 'echo "stopping myself"\nkill -TERM $$\nsleep 5\n' > 'night jobs/stuck.sh'
printf 'exit 20\n' > 'night jobs/twenty.sh'
printf 'exit 9\n' > 'night jobs/nine.sh'
printf 'echo "synced"\n' > 'night jobs/nightly sync.sh'

actual=$(bash solution.sh 'night jobs/nine.sh' 'night jobs/stuck.sh' 'night jobs/nightly sync.sh' 'night jobs/twenty.sh' 2> /dev/null)
status=$?
assert_eq "$actual" 'ok: 1
failed: 3
worst: 143' "a job ended by a signal, statuses compared as numbers, and a job name with a space"
assert_eq "$status" "1" "exit status when several jobs failed"
