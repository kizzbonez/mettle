cat > nginx-chain.txt <<'EOF'
The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

nginx.service @10.102s +1.286s
└─network-online.target @10.098s
  └─user@1000.service @3.201s +412ms
    └─-.mount @980ms +12ms
      └─systemd-fsck@dev-disk-by\x2duuid-9b2d6c1e\x2d4a7f.service @700ms +250ms
EOF
assert_eq "$(bash solution.sh nginx-chain.txt 0)" '1286 ms nginx.service
412 ms user@1000.service
250 ms systemd-fsck@dev-disk-by\x2duuid-9b2d6c1e\x2d4a7f.service
12 ms -.mount' \
  "the explanation lines, a first line without tree drawing, and names with @, \\ and a leading -"
