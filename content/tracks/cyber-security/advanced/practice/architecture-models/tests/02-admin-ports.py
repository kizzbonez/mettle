# open_admin_ports: world sources, port ranges, all-traffic rules and other protocols.
cases = [
    ({"cidr_ipv4": "0.0.0.0/0", "from_port": 20, "to_port": 25, "ip_protocol": "tcp"}, [22],
     "a tcp range from 20 to 25 open to 0.0.0.0/0"),
    ({"cidr_ipv4": "0.0.0.0/0", "from_port": 3306, "to_port": 5432, "ip_protocol": "tcp"}, [3306, 3389, 5432],
     "a tcp range whose ends are both admin ports"),
    ({"cidr_ipv4": "0.0.0.0/0", "from_port": 23, "to_port": 3305, "ip_protocol": "tcp"}, [],
     "a tcp range that stops just short of the admin ports on both sides"),
    ({"cidr_ipv4": "0.0.0.0/0", "ip_protocol": "-1"}, [22, 3306, 3389, 5432],
     "an all-traffic rule (ip_protocol -1, no ports) open to 0.0.0.0/0"),
    ({"cidr_ipv6": "::/0", "ip_protocol": "-1"}, [22, 3306, 3389, 5432],
     "an all-traffic rule open to ::/0"),
    ({"cidr_ipv6": "::/0", "from_port": 5432, "to_port": 5432, "ip_protocol": "tcp"}, [5432],
     "port 5432 open to ::/0"),
    ({"cidr_ipv4": "10.40.0.0/16", "ip_protocol": "-1"}, [],
     "an all-traffic rule from a private network"),
    ({"cidr_ipv6": "2001:db8::/32", "from_port": 22, "to_port": 22, "ip_protocol": "tcp"}, [],
     "SSH from an IPv6 network that is not ::/0"),
    ({"cidr_ipv4": "0.0.0.0/0", "from_port": 0, "to_port": 65535, "ip_protocol": "udp"}, [],
     "a udp rule over every port"),
    ({"cidr_ipv4": "0.0.0.0/0", "from_port": -1, "to_port": -1, "ip_protocol": "icmp"}, [],
     "an icmp rule"),
    ({"referenced_security_group_id": "sg-0a1b2c3d", "from_port": 22, "to_port": 22, "ip_protocol": "tcp"}, [],
     "a rule whose source is another security group"),
]
for rule, expected, what in cases:
    got = open_admin_ports(rule)
    assert got == expected, f"open_admin_ports for {what}"
