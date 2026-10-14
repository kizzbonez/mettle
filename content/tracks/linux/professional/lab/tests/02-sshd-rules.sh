# Each bundle holds only an sshd_config section; only the "sshd:" lines are compared.
sshd_lines() {
  bash solution.sh "$1" "" | grep '^sshd:'
}

cat > case-and-order.txt <<'EOF'
### cat /etc/ssh/sshd_config
PASSWORDAUTHENTICATION no
PermitRootLogin prohibit-password
PasswordAuthentication yes
PermitRootLogin no

EOF
assert_eq "$(sshd_lines case-and-order.txt)" "sshd: PermitRootLogin is prohibit-password (want no)" \
  "keywords in any letter case, and the value sshd uses when a keyword appears twice"

cat > defaults.txt <<'EOF'
### cat /etc/ssh/sshd_config
Include /etc/ssh/sshd_config.d/*.conf
#PermitRootLogin no
#PasswordAuthentication no
UsePAM yes

EOF
assert_eq "$(sshd_lines defaults.txt)" "sshd: PermitRootLogin is prohibit-password (want no)
sshd: PasswordAuthentication is yes (want no)" \
  "built-in defaults when both keywords are only in comments"

cat > match-block.txt <<'EOF'
### cat /etc/ssh/sshd_config
   # PermitRootLogin no   (indented comment)
	PasswordAuthentication no
Match Address 10.0.0.0/8
	PermitRootLogin no
	PasswordAuthentication yes

EOF
assert_eq "$(sshd_lines match-block.txt)" "sshd: PermitRootLogin is prohibit-password (want no)" \
  "indented lines, indented comments, and settings inside a Match block"

cat > compliant.txt <<'EOF'
### cat /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
EOF
assert_eq "$(sshd_lines compliant.txt)" "" "a configuration that meets the policy"
