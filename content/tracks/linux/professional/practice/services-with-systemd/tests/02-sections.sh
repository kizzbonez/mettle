cat > worker.service <<'EOF'
[Unit]
Description=Queue worker
User=worker
  ; WantedBy=multi-user.target

[Service]
  Type = simple
	ExecStart = /usr/bin/java -Dlog.file=/var/log/worker.log -jar /srv/worker.jar >> /var/log/worker.out
  user=worker
Restart = always
WantedBy=multi-user.target

[Install]
# WantedBy=multi-user.target
Alias=queue-worker.service
EOF
actual=$(bash solution.sh worker.service)
status=$?
assert_eq "$actual" "shell syntax in ExecStart: /usr/bin/java -Dlog.file=/var/log/worker.log -jar /srv/worker.jar >> /var/log/worker.out
runs as root: no User=
cannot be enabled: no WantedBy= in [Install]" \
  "settings in the wrong section, lower-case keys, comments, spaces around = and an = inside a value"
assert_eq "$status" "1" "exit status when the unit has problems"

cat > labels.service <<'EOF'
# Label printer bridge, reviewed by ops
[Unit]
Description=Label printer bridge

[Service]
User = labels
	ExecStart=/usr/local/bin/label-bridge --listen 127.0.0.1:9100
Restart=on-failure

[Install]
WantedBy = multi-user.target
EOF
actual=$(bash solution.sh labels.service)
status=$?
assert_eq "$actual" "no problems found" "a correct unit written with tabs and spaces around ="
assert_eq "$status" "0" "exit status when the unit has no problem"
