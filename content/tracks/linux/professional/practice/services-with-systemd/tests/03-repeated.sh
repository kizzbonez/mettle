cat > reset.service <<'EOF'
[Service]
User=etl
User=
Restart=always
Restart=
ExecStart=/usr/local/bin/etl-run

[Install]
WantedBy=multi-user.target
WantedBy=
EOF
assert_eq "$(bash solution.sh reset.service)" "runs as root: no User=
not restarted after a crash: Restart=no
cannot be enabled: no WantedBy= in [Install]" "empty values that reset User, Restart and WantedBy"

cat > later.service <<'EOF'
[Service]
Restart=no
User=etl
Restart=on-abnormal
ExecStart=/usr/local/bin/etl-run

[Install]
WantedBy=
WantedBy=multi-user.target
EOF
assert_eq "$(bash solution.sh later.service)" "no problems found" "later lines that set Restart and WantedBy again"

cat > last.service <<'EOF'
[Service]
User=etl
Restart=on-failure
ExecStart=/usr/local/bin/etl-run
Restart=no

[Install]
WantedBy=multi-user.target
EOF
assert_eq "$(bash solution.sh last.service)" "not restarted after a crash: Restart=no" \
  "the last Restart line wins"
