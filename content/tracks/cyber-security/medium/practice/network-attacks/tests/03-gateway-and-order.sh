cat > t3.log <<'EOF'
Oct 18 22:10:00 mon01 arpwatch: new station 10.40.0.1 0:50:56:9a:10:1 eth0
Oct 18 22:15:41 mon01 arpwatch: changed ethernet address 10.40.0.100 2:42:ac:11:0:2 (2:42:ac:11:0:3) eth0
Oct 18 22:16:02 mon01 arpwatch: changed ethernet address 10.40.0.10 b8:27:eb:44:a:1 (b8:27:eb:44:a:2) eth0
Oct 18 22:16:30 mon01 arpwatch: flip flop 10.40.0.100 2:42:ac:11:0:3 (2:42:ac:11:0:2) eth0
Oct 18 22:17:45 mon01 arpwatch: changed ethernet address 10.40.0.9 0:16:3e:1:2:3 (0:16:3e:1:2:4) eth0
EOF
actual=$(bash solution.sh t3.log 10.40.0.1)
status=$?
assert_eq "$actual" "arp 10.40.0.100 changes=2 macs=02:42:ac:11:00:02,02:42:ac:11:00:03
arp 10.40.0.10 changes=1 macs=b8:27:eb:44:0a:01,b8:27:eb:44:0a:02
arp 10.40.0.9 changes=1 macs=00:16:3e:01:02:03,00:16:3e:01:02:04" \
  "IPs in order of first change, and an address that only starts like the gateway's is not the gateway"
assert_eq "$status" "1" "exit status when only other hosts changed"

actual=$(bash solution.sh t3.log 10.40.0.10)
status=$?
assert_eq "$(sed -n 2p <<< "$actual")" "arp 10.40.0.10 changes=1 macs=b8:27:eb:44:0a:01,b8:27:eb:44:0a:02 gateway" \
  "the gateway mark when GATEWAY is 10.40.0.10"
assert_eq "$status" "2" "exit status when the gateway given on the command line changed"
