actual=$(bash solution.sh data/ip-br-address.txt)
assert_eq "$actual" "lo 127.0.0.1/8 network 127.0.0.0/8 loopback
ens3 203.0.113.42/28 network 203.0.113.32/28 public
ens4 192.168.10.1/24 network 192.168.10.0/24 private
ens4 192.168.10.254/24 network 192.168.10.0/24 private
wg0 10.99.0.1/24 network 10.99.0.0/24 private" "the IPv4 addresses in data/ip-br-address.txt"
