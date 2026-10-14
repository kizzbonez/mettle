cat > answers.txt <<'EOF'
db02.corp.example.com.	300	IN	A	10.20.0.99
ldap01.corp.example.com. 3600	IN	A	10.20.0.40
EOF
assert_eq "$(bash solution.sh data/hosts answers.txt)" "hosts and DNS agree" \
  "a hosts file that matches DNS for every name"

: > empty.txt
assert_eq "$(bash solution.sh data/hosts empty.txt)" "hosts and DNS agree" "no DNS answers at all"
