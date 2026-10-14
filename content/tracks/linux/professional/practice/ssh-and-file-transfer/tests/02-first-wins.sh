cat > config <<'EOF'
# defaults for every host, before any Host line
User ops

Host *
    Port 2200
    User guest

Host build??
    Port 22
    User ci
    HostName %h.ci.example.com
    HostName ignored.example.com
EOF
assert_eq "$(bash solution.sh config build07)" "hostname build07.ci.example.com
user ops
port 2200
proxyjump none" "lines before the first Host, a Host * block placed first, and a keyword set twice in one block"
assert_eq "$(bash solution.sh config laptop)" "hostname laptop
user ops
port 2200
proxyjump none" "a host that only the general settings apply to"
