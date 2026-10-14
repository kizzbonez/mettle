Write `solution.sh`. It is run as `bash solution.sh JOB...`: each argument is a job, a shell
script to run with `bash JOB`. Names may contain spaces. There may be no arguments at all.

1. **Start** every job in the background, each with `bash JOB`, **before** waiting for any of
   them: jobs may depend on each other, so all of them must be running at the same time. Send
   each job's standard output and standard error to `/dev/null`.
2. **Wait** for each job by its process ID and take its exit status. Remember that a job ended
   by a signal reports 128 plus the signal's number, such as `143` for `TERM`.
3. **Print** three lines:
   - `ok: N`, the number of jobs that exited with status `0`;
   - `failed: N`, the number of all the others;
   - `worst: S`, the highest exit status of any job, or `0` when there were no failures.
4. **Exit** with status `1` when at least one job failed, and `0` otherwise.

For the sample jobs (`bash solution.sh data/backup.sh data/report.sh data/cleanup.sh`) the
output is:

```text
ok: 2
failed: 1
worst: 3
```

and the script exits with status `1`, because `report.sh` exits with `3`. Nothing the jobs print
appears.

**Tips.**
- `$!` holds the process ID of the job just started. Collect the IDs in one variable, separated
  by spaces (`pids="$pids $!"`), and loop over `$pids` without quotes afterwards: the IDs are plain
  numbers, so splitting at the spaces is what you want here.
- `wait PID` waits for that one process and returns its exit status, so `$?` straight after it
  is the job's status.
- Compare statuses as numbers, with `-gt`.
