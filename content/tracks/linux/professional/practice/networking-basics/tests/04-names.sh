cat > host.txt <<'EOF'
lo               UNKNOWN        127.0.0.1/8 ::1/128
ens3.100@ens3    UP             10.100.0.2/24 fe80::5054:ff:fe12:3401/64
veth3@if12       UP             172.18.0.1/16 fe80::a8c1:abff:fe12:3456/64
br0              DOWN
wg1              UNKNOWN        fd42:42::1/64
docker0          DOWN           172.17.0.1/16
EOF
assert_eq "$(bash solution.sh host.txt)" "lo 127.0.0.1/8 network 127.0.0.0/8 loopback
ens3.100 10.100.0.2/24 network 10.100.0.0/24 private
veth3 172.18.0.1/16 network 172.18.0.0/16 private
docker0 172.17.0.1/16 network 172.17.0.0/16 private" \
  "names with @, interfaces without addresses or with IPv6 only, and a DOWN interface"
