cat > edges.txt <<'EOF'
dummy0           UNKNOWN        172.15.255.1/24 172.16.0.1/24 172.31.255.254/24 172.32.0.1/24
dummy1           UNKNOWN        192.168.0.1/24 192.169.0.1/24 11.0.0.1/8 10.255.255.254/8
dummy2           UNKNOWN        169.254.1.1/16 169.255.0.1/16 127.53.0.1/8 128.0.0.1/8
EOF
assert_eq "$(bash solution.sh edges.txt)" "dummy0 172.15.255.1/24 network 172.15.255.0/24 public
dummy0 172.16.0.1/24 network 172.16.0.0/24 private
dummy0 172.31.255.254/24 network 172.31.255.0/24 private
dummy0 172.32.0.1/24 network 172.32.0.0/24 public
dummy1 192.168.0.1/24 network 192.168.0.0/24 private
dummy1 192.169.0.1/24 network 192.169.0.0/24 public
dummy1 11.0.0.1/8 network 11.0.0.0/8 public
dummy1 10.255.255.254/8 network 10.0.0.0/8 private
dummy2 169.254.1.1/16 network 169.254.0.0/16 link-local
dummy2 169.255.0.1/16 network 169.255.0.0/16 public
dummy2 127.53.0.1/8 network 127.0.0.0/8 loopback
dummy2 128.0.0.1/8 network 128.0.0.0/8 public" \
  "addresses just inside and just outside the private, link-local and loopback ranges"
