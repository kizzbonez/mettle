cat > config <<'EOF'
Host bastion.corp.example.com
    User ana

Host *.corp.example.com !bastion.corp.example.com
    ProxyJump bastion.corp.example.com
    User ana

Host db1
    Port 5022

Host db? !db9
    HostName %h.dbs.corp.example.com
    User dba
    ProxyJump bastion.corp.example.com
EOF
assert_eq "$(bash solution.sh config bastion.corp.example.com)" "hostname bastion.corp.example.com
user ana
port 22
proxyjump none" "a host excluded by a ! pattern"
assert_eq "$(bash solution.sh config files.corp.example.com)" "hostname files.corp.example.com
user ana
port 22
proxyjump bastion.corp.example.com" "a * pattern with a ! exception that does not apply"
assert_eq "$(bash solution.sh config db1)" "hostname db1.dbs.corp.example.com
user dba
port 5022
proxyjump bastion.corp.example.com" "an exact pattern and a ? pattern for the same host"
assert_eq "$(bash solution.sh config db10)" "hostname db10
user none
port 22
proxyjump none" "? matches exactly one character"
assert_eq "$(bash solution.sh config db9)" "hostname db9
user none
port 22
proxyjump none" "a host matched by one pattern and excluded by another in the same Host line"
