cat > quiet-vmstat.txt <<'EOF'
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  2  20480 912344 120184 6120448   15   22   410   288  612 1033  6  2 70 22  0
 0  0  20480 912100 120188 6120500    0    0     0    12  410  733  1  1 98  0  0
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0  20480 911980 120188 6120512    0    0     0     8  402  719  1  0 99  0  0
EOF
assert_eq "$(bash solution.sh quiet-vmstat.txt data/ps.txt 2)" "bottleneck: none" \
  "a quiet machine whose since-boot line looks busy"

cat > backup-vmstat.txt <<'EOF'
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  0      0 512344  20184 2120448    0    0    10    30  212  433  2  1 97  0  0
 0  0      0 512100  20188 2120500    0    0     0    12  410  733  1  1 97  1  0
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  3      0 498120  20190 2133012    0    0 61210   140 1530 2210  2  4 39 55  0
 1  0      0 497980  20192 2133100    0    0  2210    96  612 1044  3  2 89  6  0
EOF
cat > backup-ps.txt <<'EOF'
    PID USER     STAT %CPU %MEM   RSS COMMAND
    211 root     D     0.0  0.0     0 jbd2/dm-0-8
    640 root     Ss    0.0  0.1  9120 cron
   7012 backup   D<    3.1  0.2 40120 borg
   7100 ana      Z     0.0  0.0     0 sh <defunct>
EOF
assert_eq "$(bash solution.sh backup-vmstat.txt backup-ps.txt 2)" "bottleneck: io
suspect: 211 jbd2/dm-0-8
suspect: 7012 borg" "a header repeated in the middle, averages exactly on the limits, and D states"
