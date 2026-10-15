actual=$(bash solution.sh data/eve.json data/threshold.config)
status=$?
assert_eq "$actual" "FOLLOW-UP sev1 192.0.2.140 sid:1000005 x2 LOCAL SQL injection in search parameter
FOLLOW-UP sev2 198.51.100.23 sid:1000003 x3 LOCAL Possible SSH brute force
FOLLOW-UP sev3 10.30.0.7 sid:1000009 x1 LOCAL Request for /admin path
BLOCKED sev1 203.0.113.77 sid:1000001 x3 LOCAL Path traversal in URI
BLOCKED sev1 203.0.113.77 sid:1000005 x1 LOCAL SQL injection in search parameter" \
  "triage of data/eve.json with data/threshold.config"
assert_eq "$status" "1" "exit status when a group needs a follow-up"
