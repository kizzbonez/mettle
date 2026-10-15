cat > t2-policy.csv <<'EOF'
seq,from,to,proto,port,action
# numeric order matters: 5 before 20 before 100
100,lan,any,any,any,allow
20,lan,srv,tcp,22,deny
5,LAN,SRV,TCP,8443,ALLOW
30,any,srv,udp,514,allow
40,lan,srv,tcp,9000-9100,allow
50,lan,srv,any,5432,deny
EOF
cat > t2-checks.txt <<'EOF'
allow lan srv tcp/22
allow lan srv tcp/8443
deny lan srv tcp/80
allow dmz srv udp/514
allow lan srv udp/514
allow dmz srv tcp/514
allow lan srv tcp/9000
allow lan srv tcp/9100
allow lan srv tcp/9101
deny lan srv tcp/8999
allow lan srv udp/5432
EOF
actual=$(bash solution.sh t2-policy.csv t2-checks.txt)
assert_eq "$actual" "FAIL lan srv tcp/22 deny (rule 20)
PASS lan srv tcp/8443 allow (rule 5)
FAIL lan srv tcp/80 allow (rule 100)
PASS dmz srv udp/514 allow (rule 30)
PASS lan srv udp/514 allow (rule 30)
FAIL dmz srv tcp/514 deny (default)
PASS lan srv tcp/9000 allow (rule 40)
PASS lan srv tcp/9100 allow (rule 40)
PASS lan srv tcp/9101 allow (rule 100)
FAIL lan srv tcp/8999 allow (rule 100)
FAIL lan srv udp/5432 deny (rule 50)
SUMMARY 6 passed, 5 failed" \
  "first match in numeric seq order, mixed-case fields, any zones and protocols, inclusive port ranges"
