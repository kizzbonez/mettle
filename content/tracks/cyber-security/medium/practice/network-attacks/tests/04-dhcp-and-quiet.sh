cat > t4.log <<'EOF'
Oct 19 07:30:00 sw-floor1 301: Oct 19 07:30:00: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPREQUEST, MAC sa: 7c2e.0d11.4b20
Oct 19 07:30:02 sw-floor1 302: Oct 19 07:30:02: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPACK, MAC sa: 7c2e.0d11.4b21
Oct 19 07:30:05 sw-floor1 303: Oct 19 07:30:05: %DHCP_SNOOPING-5-DHCP_SNOOPING_MATCH_MAC_FAIL: DHCP_SNOOPING drop message because the chaddr doesn't match source mac, message type: DHCPOFFER, chaddr: 0000.5e00.5301, MAC sa: 7c2e.0d11.4b22
Oct 19 07:30:09 sw-floor1 304: Oct 19 07:30:09: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPNAK, MAC sa: 7c2e.0d11.4b21
Oct 19 07:31:00 sw-floor1 305: Oct 19 07:31:00: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: 0011.2233.4455
Oct 19 07:31:04 sw-floor1 306: Oct 19 07:31:04: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPDISCOVER, MAC sa: 0011.2233.4455
Oct 19 07:31:09 sw-floor1 307: Oct 19 07:31:09: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPACK, MAC sa: 7c2e.0d11.4b21
EOF
actual=$(bash solution.sh t4.log 10.40.0.1)
status=$?
assert_eq "$actual" "dhcp 7c:2e:0d:11:4b:21 dropped=2
dhcp 00:11:22:33:44:55 dropped=1" \
  "only DHCPOFFER and DHCPACK on untrusted ports count, per server MAC in order of first drop"
assert_eq "$status" "1" "exit status for rogue DHCP without ARP changes"

cat > t4-quiet.log <<'EOF'
Oct 19 09:00:00 mon01 arpwatch: new station 10.40.1.20 3c:22:fb:9:1:7 eth0
Oct 19 09:05:00 mon01 arpwatch: new activity 10.40.1.21 3c:22:fb:9:1:8 eth0
Oct 19 09:06:00 sw-floor1 310: Oct 19 09:06:00: %DHCP_SNOOPING-4-DHCP_SNOOPING_ERRDISABLE_WARNING: DHCP Snooping received 30 DHCP packets on interface GigabitEthernet1/0/3
EOF
actual=$(bash solution.sh t4-quiet.log 10.40.0.1)
status=$?
assert_eq "$actual" "no spoofing seen" "a log with only new stations and other events"
assert_eq "$status" "0" "exit status with no findings"

: > t4-empty.log
actual=$(bash solution.sh t4-empty.log 10.40.0.1)
status=$?
assert_eq "$actual" "no spoofing seen" "an empty log"
assert_eq "$status" "0" "exit status for an empty log"
