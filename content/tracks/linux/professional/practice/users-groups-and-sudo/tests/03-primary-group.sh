cat > passwd <<'EOF'
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
kim:x:1003:100:Kim Ito,,,:/home/kim:/bin/bash
svc-plot:x:997:997::/srv/plot:/usr/sbin/nologin
EOF
cat > group <<'EOF'
www-data:x:33:kim
users:x:100:ana,kim
plotters:x:997:
svc-plot:x:1997:
staff:x:50:kim
EOF

assert_eq "$(bash solution.sh passwd group kim)" \
  "uid=1003(kim) gid=100(users) groups=100(users),33(www-data),50(staff)" \
  "a primary group that the user is also listed in, and where it goes in the list"
assert_eq "$(bash solution.sh passwd group svc-plot)" \
  "uid=997(svc-plot) gid=997(plotters) groups=997(plotters)" \
  "the primary group is found by its GID, not by the user's name"
assert_eq "$(bash solution.sh passwd group www-data)" \
  "uid=33(www-data) gid=33(www-data) groups=33(www-data)" \
  "a user with no supplementary groups"
