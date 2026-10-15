actual=$(bash solution.sh data/zone-policy.csv data/expected-isolation.txt)
status=$?
assert_eq "$actual" "PASS guest plant tcp/502 deny (default)
PASS office plant tcp/502 deny (rule 90)
PASS mgmt plant tcp/22 allow (rule 60)
PASS wan dmz tcp/443 allow (rule 30)
PASS wan hist tcp/5432 deny (default)
PASS office hist tcp/8080 allow (rule 80)
FAIL office plant tcp/3389 allow (rule 25)
SUMMARY 6 passed, 1 failed" "the checks of data/expected-isolation.txt against data/zone-policy.csv"
assert_eq "$status" "1" "exit status when a check fails"
