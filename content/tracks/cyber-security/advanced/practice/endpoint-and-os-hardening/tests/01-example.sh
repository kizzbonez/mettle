actual=$(bash solution.sh data/sysctl-baseline.txt data)
status=$?
assert_eq "$actual" "FAIL net.ipv4.ip_forward 1 (60-imaging-gateway.conf; baseline 0)
PASS net.ipv4.conf.all.accept_redirects 0 (50-hardening.conf; baseline 0)
FAIL net.ipv4.conf.all.send_redirects 1 (60-imaging-gateway.conf; baseline 0)
PASS net.ipv4.conf.all.rp_filter 1 (50-hardening.conf; baseline 1)
PASS net.ipv4.tcp_syncookies 1 (10-network-security.conf; baseline 1)
PASS kernel.kptr_restrict 2 (50-hardening.conf; baseline 2)
PASS kernel.dmesg_restrict 1 (50-hardening.conf; baseline 1)
PASS kernel.randomize_va_space 2 (default; baseline 2)
FAIL kernel.yama.ptrace_scope 0 (default; baseline 1)" \
  "the check of data/sysctl-baseline.txt against the .conf files in data"
assert_eq "$status" "1" "exit status when a setting fails"
