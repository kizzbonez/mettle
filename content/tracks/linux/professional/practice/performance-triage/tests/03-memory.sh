cat > desktop-vmstat.txt <<'EOF'
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  1 1048572  98312   2104 140220    0    0   210   330  901 1544 12  6 70 12  0
 1  4 2097148  88120   1040  90120    0    0  3310  6620 1210 2410  8 11 21 60  0
 2  3 2621436  84032    988  80220    0  1210  2810  5010 1112 2281  9 10 25 56  0
EOF
cat > desktop-ps.txt <<'EOF'
    PID USER     STAT %CPU %MEM   RSS COMMAND
    903 root     Ssl   0.4  2.2 998312 Xorg
   1188 ana      Sl    6.3 12.4 2034112 firefox-esr
   1201 ana      Dl    4.1 37.5 6120340 Web Content
   1530 lee      Sl    1.2 33.0 5411204 java
EOF
assert_eq "$(bash solution.sh desktop-vmstat.txt desktop-ps.txt 4)" "bottleneck: memory
suspect: 1201 Web Content" \
  "swapping out in one report wins over waiting for disk, and the largest RSS by number"
