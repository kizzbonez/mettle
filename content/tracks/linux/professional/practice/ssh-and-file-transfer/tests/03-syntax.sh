cat > config <<'EOF'
HOST  gw
	hostname=gw.shipping.example
  USER = harbour
PORT   =   2022

host	crane?
	ProxyJump=gw
	HostName	%h.port.example
	user crane-ops
  # User someone-else

Host *
   port 22
EOF
assert_eq "$(bash solution.sh config crane3)" "hostname crane3.port.example
user crane-ops
port 22
proxyjump gw" "keywords in any letter case, tabs, and = with or without blanks"
assert_eq "$(bash solution.sh config gw)" "hostname gw.shipping.example
user harbour
port 2022
proxyjump none" "a block written with upper-case keywords and = separators"
