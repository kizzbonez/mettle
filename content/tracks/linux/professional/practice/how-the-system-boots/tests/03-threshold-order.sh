cat > desktop-chain.txt <<'EOF'
The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

multi-user.target @9.512s
└─cups.service @8.101s +1.411s
  └─nss-lookup.target @8.090s
    └─avahi-daemon.service @6.679s +1.411s
      └─bluetooth.target @6.670s
        └─bluetooth.service @5.259s +1.411s
          └─network.target @5.250s
            └─wpa_supplicant.service @3.780s +1.470s
              └─dbus.service @3.680s +98ms
                └─basic.target @3.670s
EOF
assert_eq "$(bash solution.sh desktop-chain.txt 1411)" "1470 ms wpa_supplicant.service
1411 ms cups.service
1411 ms avahi-daemon.service
1411 ms bluetooth.service" "a limit equal to some times, and equal times kept in chain order"
assert_eq "$(bash solution.sh desktop-chain.txt 0)" "1470 ms wpa_supplicant.service
1411 ms cups.service
1411 ms avahi-daemon.service
1411 ms bluetooth.service
98 ms dbus.service" "every unit with a start-up time"
assert_eq "$(bash solution.sh desktop-chain.txt 2000)" "" "a limit no unit reaches"
