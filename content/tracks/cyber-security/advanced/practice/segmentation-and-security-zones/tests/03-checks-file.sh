cat > t3-policy.csv <<'EOF'
# screened subnet policy
seq,from,to,proto,port,action

10,wan,dmz,tcp,443,allow
20,dmz,srv,tcp,5432,allow

30,mgmt,any,tcp,22,allow
EOF
cat > t3-checks.txt <<'EOF'
# expected reachability, with uneven spacing

allow   wan    dmz   tcp/443
	deny	wan	srv	tcp/5432
   # an indented comment
deny guest  mgmt tcp/22
allow mgmt  dmz  tcp/22

EOF
actual=$(bash solution.sh t3-policy.csv t3-checks.txt)
status=$?
assert_eq "$actual" "PASS wan dmz tcp/443 allow (rule 10)
PASS wan srv tcp/5432 deny (default)
PASS guest mgmt tcp/22 deny (default)
PASS mgmt dmz tcp/22 allow (rule 30)
SUMMARY 4 passed, 0 failed" "checks separated by spaces and tabs, with blank lines and indented comments, all passing"
assert_eq "$status" "0" "exit status when every check passes"

cat > t3-fail.txt <<'EOF'
deny wan dmz tcp/443
allow dmz srv tcp/5432
EOF
actual=$(bash solution.sh t3-policy.csv t3-fail.txt)
status=$?
assert_eq "$actual" "FAIL wan dmz tcp/443 allow (rule 10)
PASS dmz srv tcp/5432 allow (rule 20)
SUMMARY 1 passed, 1 failed" "a check expecting deny where the policy allows"
assert_eq "$status" "1" "exit status when one check fails"
