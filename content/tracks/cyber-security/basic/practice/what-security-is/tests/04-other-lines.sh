cat > t4-auth.log <<'EOF'
Nov  5 06:25:01 books02 CRON[3310]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)
Nov  5 06:30:12 books02 sudo: pam_unix(sudo:session): session opened for user root(uid=0) by j.okafor(uid=1004)
Nov  5 06:30:14 books02 sudo: pam_unix(sudo:session): session closed for user root
Nov  5 06:31:00 books02 systemd-logind[612]: New session 41 of user j.okafor.
Nov  5 06:40:09 books02 sshd[3402]: Connection closed by 203.0.113.12 port 40022 [preauth]
EOF
: > t4-empty.log

actual=$(bash solution.sh t4-auth.log)
status=$?
assert_eq "$actual" "" "lines that record no authentication or authorization decision print nothing"
assert_eq "$status" "0" "exit status after a log with no AAA events"

actual=$(bash solution.sh t4-empty.log)
status=$?
assert_eq "$actual" "" "an empty log prints nothing"
assert_eq "$status" "0" "exit status after an empty log"
