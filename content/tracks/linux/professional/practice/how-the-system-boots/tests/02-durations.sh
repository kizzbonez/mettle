cat > db-chain.txt <<'EOF'
The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

graphical.target @5min 14.412s
└─multi-user.target @5min 14.411s
  └─postgresql@15-main.service @4min 12.370s +1min 2.040s
    └─remote-fs.target @4min 12.360s
      └─mnt-archive.mount @3min 6.340s +1min 6.012s
        └─network-online.target @3min 6.335s
          └─wait-for-san.service @3min 1.330s +5s
            └─iscsid.service @1min 1.320s +2min 5ms
              └─systemd-udev-settle.service @1.311s +1min
                └─systemd-udevd.service @1.100s +180ms
                  └─systemd-journald.socket @1.000s
EOF
assert_eq "$(bash solution.sh db-chain.txt 0)" "120005 ms iscsid.service
66012 ms mnt-archive.mount
62040 ms postgresql@15-main.service
60000 ms systemd-udev-settle.service
5000 ms wait-for-san.service
180 ms systemd-udevd.service" \
  "times in minutes, seconds and milliseconds, alone and combined, after @ times that contain a space"
