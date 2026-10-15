mkdir -p t3-sysctl.d
printf '%s\n' \
  '# comment' \
  '   ; indented semicolon comment' \
  '	# indented hash comment, kernel.randomize_va_space = 0' \
  '' \
  'net.ipv4.ip_forward=1' \
  '  net.ipv4.ip_forward	=	0  ' \
  '-net.ipv4.conf.all.accept_redirects = 0' \
  'net/ipv4/conf/all/send_redirects = 0' \
  'net.ipv4.conf.all.send_redirects' \
  'fs.protected_symlinks = 1   ' \
  > t3-sysctl.d/60-mixed.conf
printf 'net.ipv4.conf.all.rp_filter = 1' > t3-sysctl.d/70-no-final-newline.conf
cat > t3-baseline.txt <<'EOF'
# key want default

net.ipv4.ip_forward 0 0
net.ipv4.conf.all.accept_redirects 0 1
net.ipv4.conf.all.send_redirects 0 1
fs.protected_symlinks 1 0
kernel.randomize_va_space 2 2
net.ipv4.conf.all.rp_filter 1 0
EOF
actual=$(bash solution.sh t3-baseline.txt t3-sysctl.d)
status=$?
assert_eq "$actual" "PASS net.ipv4.ip_forward 0 (60-mixed.conf; baseline 0)
PASS net.ipv4.conf.all.accept_redirects 0 (60-mixed.conf; baseline 0)
PASS net.ipv4.conf.all.send_redirects 0 (60-mixed.conf; baseline 0)
PASS fs.protected_symlinks 1 (60-mixed.conf; baseline 1)
PASS kernel.randomize_va_space 2 (default; baseline 2)
PASS net.ipv4.conf.all.rp_filter 1 (70-no-final-newline.conf; baseline 1)" \
  "comments with # and ;, spaces and tabs around =, a leading -, slashes in keys, a line without = and a last line without a newline"
assert_eq "$status" "0" "exit status when every setting passes"
