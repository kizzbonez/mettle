mkdir -p t4-empty
printf 'drop-in files go here\n' > t4-empty/README
actual=$(bash solution.sh data/sysctl-baseline.txt t4-empty)
status=$?
assert_eq "$actual" "PASS net.ipv4.ip_forward 0 (default; baseline 0)
FAIL net.ipv4.conf.all.accept_redirects 1 (default; baseline 0)
FAIL net.ipv4.conf.all.send_redirects 1 (default; baseline 0)
FAIL net.ipv4.conf.all.rp_filter 0 (default; baseline 1)
PASS net.ipv4.tcp_syncookies 1 (default; baseline 1)
FAIL kernel.kptr_restrict 0 (default; baseline 2)
FAIL kernel.dmesg_restrict 0 (default; baseline 1)
PASS kernel.randomize_va_space 2 (default; baseline 2)
FAIL kernel.yama.ptrace_scope 0 (default; baseline 1)" \
  "a folder without any .conf file: every value is the kernel default"
assert_eq "$status" "1" "exit status when defaults fail the baseline"

mkdir -p t4-one
printf 'kernel.unprivileged_bpf_disabled = 1\nkernel.yama.ptrace_scope = 2\n' > t4-one/40-bpf.conf
printf '# only comments\n\n' > t4-baseline.txt
actual=$(bash solution.sh t4-baseline.txt t4-one)
status=$?
assert_eq "$actual" "" "a baseline with only a comment and a blank line prints nothing"
assert_eq "$status" "0" "exit status when there is nothing to check"

printf 'kernel.yama.ptrace_scope 1 0\n' > t4-baseline2.txt
actual=$(bash solution.sh t4-baseline2.txt t4-one)
assert_eq "$actual" "FAIL kernel.yama.ptrace_scope 2 (40-bpf.conf; baseline 1)" \
  "values are compared as text: a stricter value is still a difference"
