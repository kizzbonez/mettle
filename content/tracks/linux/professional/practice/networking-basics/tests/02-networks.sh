cat > prefixes.txt <<'EOF'
eth0             UP             192.168.10.37/22
eth1             UP             10.20.0.50/32 10.4.0.77/26
eth2             UP             172.20.5.9/12 10.200.1.1/9
eth3             UP             169.254.33.7/16
EOF
assert_eq "$(bash solution.sh prefixes.txt)" "eth0 192.168.10.37/22 network 192.168.8.0/22 private
eth1 10.20.0.50/32 network 10.20.0.50/32 private
eth1 10.4.0.77/26 network 10.4.0.64/26 private
eth2 172.20.5.9/12 network 172.16.0.0/12 private
eth2 10.200.1.1/9 network 10.128.0.0/9 private
eth3 169.254.33.7/16 network 169.254.0.0/16 link-local" \
  "networks of prefixes that do not end on a byte boundary, and a /32"
