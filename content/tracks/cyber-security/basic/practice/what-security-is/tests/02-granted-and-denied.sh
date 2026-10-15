cat > t2-auth.log <<'EOF'
Nov  3 07:58:12 books02 sudo: j.okafor : TTY=pts/2 ; PWD=/srv/catalog ; USER=root ; COMMAND=/usr/bin/tail -n 50 /var/log/nginx/error.log
Nov  3 07:59:40 books02 sudo:   svc-backup : TTY=unknown ; PWD=/ ; USER=root ; COMMAND=/usr/bin/rsync -a /srv/catalog/ /backup/catalog/
Nov  3 08:01:05 books02 sudo:     lena : command not allowed ; TTY=pts/3 ; PWD=/home/lena ; USER=root ; COMMAND=/usr/bin/vi /etc/hosts
Nov  3 08:02:17 books02 sudo:     tariq : user NOT in sudoers ; TTY=pts/4 ; PWD=/home/tariq ; USER=root ; COMMAND=/usr/bin/passwd maya
Nov  3 08:03:00 books02 sudo:     lena : TTY=pts/3 ; PWD=/home/lena ; USER=www-data ; COMMAND=/usr/bin/ls /srv/catalog
EOF

actual=$(bash solution.sh t2-auth.log)
assert_eq "$actual" "authorization granted j.okafor /usr/bin/tail -n 50 /var/log/nginx/error.log
authorization granted svc-backup /usr/bin/rsync -a /srv/catalog/ /backup/catalog/
authorization denied lena /usr/bin/vi /etc/hosts
authorization denied tariq /usr/bin/passwd maya
authorization granted lena /usr/bin/ls /srv/catalog" \
  "sudo lines that were allowed and refused, with user names and full commands"
