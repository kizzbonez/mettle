cat > t3-auth.log <<'EOF'
Nov  4 10:12:44 books02 sudo:     lena : 3 incorrect password attempts ; TTY=pts/3 ; PWD=/home/lena ; USER=root ; COMMAND=/usr/bin/systemctl stop booking.service
Nov  4 10:13:10 books02 sudo:     lena : TTY=pts/3 ; PWD=/home/lena ; USER=root ; COMMAND=/usr/bin/systemctl status booking.service
Nov  4 10:20:02 books02 sudo:     tariq : 1 incorrect password attempt ; TTY=pts/4 ; PWD=/home/tariq ; USER=root ; COMMAND=/usr/bin/journalctl -u booking.service
Nov  4 10:21:30 books02 sshd[2291]: Failed publickey for tariq from 192.0.2.88 port 51544 ssh2: ED25519 SHA256:hWq7cJx0rTzP4mVb9LkE2sYdN6uF1gAoR3iXeZt8QpC
EOF

actual=$(bash solution.sh t3-auth.log)
assert_eq "$actual" "authentication failure lena
authorization granted lena /usr/bin/systemctl status booking.service
authentication failure tariq
authentication failure tariq" \
  "sudo lines with incorrect password attempts are authentication failures, checked before the command"
