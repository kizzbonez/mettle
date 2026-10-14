expected='disk: /var at 94%
disk: /home at 90%
unit: backup-db.service (Nightly database dump)
unit: certbot.service (Certbot)
port: 6379 on 0.0.0.0 by redis-server
port: 9100 on * by node_exporter
sshd: PermitRootLogin is yes (want no)
sshd: PasswordAuthentication is yes (want no)
account: toor has UID 0
account: guest has an empty password
findings: 10'

actual=$(bash solution.sh data/web01.txt 22,80,443)
status=$?
assert_eq "$actual" "$expected" "report for data/web01.txt with ports 22,80,443 allowed"
assert_eq "$status" "1" "exit status when the report has findings"
