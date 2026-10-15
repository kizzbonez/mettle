printf 'seq,from,to,proto,port,action\n# every rule was removed during the migration\n\n' > t4-policy.csv
printf 'allow office wan tcp/443\ndeny guest plant udp/47808\n' > t4-checks.txt
actual=$(bash solution.sh t4-policy.csv t4-checks.txt)
status=$?
assert_eq "$actual" "FAIL office wan tcp/443 deny (default)
PASS guest plant udp/47808 deny (default)
SUMMARY 1 passed, 1 failed" "a policy with no rules denies everything by default"
assert_eq "$status" "1" "exit status with a failing check and no rules"

printf '# nothing to check yet\n\n' > t4-none.txt
actual=$(bash solution.sh data/zone-policy.csv t4-none.txt)
status=$?
assert_eq "$actual" "SUMMARY 0 passed, 0 failed" "a checks file with only a comment and a blank line"
assert_eq "$status" "0" "exit status when there is nothing to check"

cat > t4-policy2.csv <<'EOF'
seq,from,to,proto,port,action
10,office,hist,tcp,8000-8100,allow
20,office,hist,udp,8000-8100,deny
30,office,hist,any,any,allow
EOF
printf 'deny office hist udp/8050\nallow office hist tcp/80\nallow office hist tcp/8000\n' > t4-checks2.txt
actual=$(bash solution.sh t4-policy2.csv t4-checks2.txt)
assert_eq "$actual" "PASS office hist udp/8050 deny (rule 20)
PASS office hist tcp/80 allow (rule 30)
PASS office hist tcp/8000 allow (rule 10)
SUMMARY 3 passed, 0 failed" "tcp and udp rules over the same range are told apart, and a range is not a prefix match"
