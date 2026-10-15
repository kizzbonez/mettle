cat > t2.log <<'EOF'
Oct 17 08:00:01 mon01 arpwatch: changed ethernet address 172.16.5.9 a:b:c:d:e:f (0:1b:2c:3d:4e:5f) eth1
Oct 17 08:00:09 mon01 arpwatch: flip flop 172.16.5.9 0:1B:2C:3D:4E:5F (A:B:C:D:E:F) eth1
Oct 17 08:00:15 mon01 arpwatch: flip flop 172.16.5.9 a:b:c:d:e:f (0:1b:2c:3d:4e:5f) eth1
Oct 17 08:00:20 mon01 arpwatch: changed ethernet address 172.16.5.9 de:ad:be:ef:0:1 (a:b:c:d:e:f) eth1
Oct 17 08:01:00 sw-core 88: Oct 17 08:01:00: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: DEAD.BEEF.0001
Oct 17 08:01:30 sw-core 89: Oct 17 08:01:30: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: dead.beef.0001
EOF
actual=$(bash solution.sh t2.log 172.16.0.1)
status=$?
assert_eq "$actual" "arp 172.16.5.9 changes=4 macs=00:1b:2c:3d:4e:5f,0a:0b:0c:0d:0e:0f,de:ad:be:ef:00:01
dhcp de:ad:be:ef:00:01 dropped=2" \
  "MACs padded to two digits, in lower case, listed once and sorted; every change event counted"
assert_eq "$status" "1" "exit status when the gateway did not change"
