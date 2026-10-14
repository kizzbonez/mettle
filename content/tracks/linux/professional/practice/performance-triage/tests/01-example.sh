actual=$(bash solution.sh data/vmstat.txt data/ps.txt 4)
assert_eq "$actual" "bottleneck: io
suspect: 3307 rsync
suspect: 3311 postgres
suspect: 3320 tar" "the bottleneck and suspects in data/vmstat.txt and data/ps.txt on 4 CPUs"
