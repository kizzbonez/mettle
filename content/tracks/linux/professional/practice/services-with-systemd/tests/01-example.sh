actual=$(bash solution.sh data/reportd.service)
status=$?
assert_eq "$actual" "shell syntax in ExecStart: /usr/local/bin/reportd --port 8080 > /var/log/reportd.log 2>&1
runs as root: no User=" "the problems of data/reportd.service"
assert_eq "$status" "1" "exit status when the unit has problems"
