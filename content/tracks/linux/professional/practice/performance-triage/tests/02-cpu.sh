cat > transcode-vmstat.txt <<'EOF'
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  0  51200 6120344 310184 5120448   12   30     8    20  212  433  2  1 97  0  0
 9  0  51200 6098120 310188 5133012    0    0     0   140 4530 3210 93  6  1  0  0
11  0  51200 6090032 310192 5140220    0    0     0   212 4612 3381 94  5  1  0  0
EOF
cat > transcode-ps.txt <<'EOF'
    PID USER     STAT %CPU %MEM   RSS COMMAND
   5101 media    R    99.8  2.1 345112 ffmpeg
   5102 media    R    99.8  2.0 339880 ffmpeg
    880 root     Ssl   3.2  0.4 61220 dockerd
   5200 media    Rl  187.4  3.3 541000 ffmpeg
   5230 media    S     0.0  0.0  2210 sleep
EOF
assert_eq "$(bash solution.sh transcode-vmstat.txt transcode-ps.txt 4)" "bottleneck: cpu
suspect: 5200 ffmpeg" \
  "more runnable tasks than CPUs, swapping only in the since-boot line, and %CPU above 100"

cat > busy-vmstat.txt <<'EOF'
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 2120344 110184 3120448    0    0     8    20  212  433  5  1 94  0  0
 7  0      0 2098120 110188 3133012    0    0     0    40 9530 8210 61 33  6  0  0
 9  0      0 2090032 110192 3140220    0    0     0    52 9612 8381 60 36  4  0  0
EOF
cat > busy-ps.txt <<'EOF'
    PID USER     STAT %CPU %MEM   RSS COMMAND
    700 redis    Ssl  12.5  4.1 412000 redis-server
    812 app      Sl   12.5  2.2 220100 gunicorn
    813 app      Sl    9.1  2.2 219880 gunicorn
EOF
assert_eq "$(bash solution.sh busy-vmstat.txt busy-ps.txt 16)" "bottleneck: cpu
suspect: 700 redis-server" "idle time below 10 on a machine with more CPUs than tasks, and a tie"
