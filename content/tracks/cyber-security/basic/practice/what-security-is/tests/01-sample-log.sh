actual=$(bash solution.sh data/auth.log)
status=$?
assert_eq "$actual" "authentication success maya
authorization granted maya /usr/bin/systemctl restart booking.service
authentication failure owen
authentication success owen
authorization denied owen /usr/bin/cat /etc/shadow
authentication failure admin
authentication failure maya" "AAA events printed for data/auth.log, in log order"
assert_eq "$status" "0" "exit status of the script"
