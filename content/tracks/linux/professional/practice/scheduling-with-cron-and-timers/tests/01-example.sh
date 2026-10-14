actual=$(bash solution.sh data/crontab "2026-10-16 07:30")
assert_eq "$actual" "playout --traffic-report
playout --show morning-news" "jobs in data/crontab at 07:30 on Friday 16 October 2026"
