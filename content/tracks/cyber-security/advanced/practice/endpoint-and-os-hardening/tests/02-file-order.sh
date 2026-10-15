mkdir -p t2-sysctl.d
printf 'kernel.kptr_restrict = 0\nkernel.sysrq = 0\n' > t2-sysctl.d/10-base.conf
printf 'kernel.kptr_restrict = 1\n' > t2-sysctl.d/9-vendor.conf
printf 'kernel.sysrq = 176\n' > t2-sysctl.d/Z-upper.conf
printf 'kernel.sysrq = 1\nkernel.sysrq = 4\n' > t2-sysctl.d/a-lower.conf
printf 'kernel.dmesg_restrict = 0\n' > t2-sysctl.d/99-old.conf.bak
printf 'kernel.dmesg_restrict = 0\n' > t2-sysctl.d/README
printf 'kernel.dmesg_restrict = 0\n' > t2-sysctl.d/50-x.confx
cat > t2-baseline.txt <<'EOF'
kernel.kptr_restrict 1 0
kernel.sysrq 0 16
kernel.dmesg_restrict 1 1
EOF
actual=$(bash solution.sh t2-baseline.txt t2-sysctl.d)
status=$?
assert_eq "$actual" "PASS kernel.kptr_restrict 1 (9-vendor.conf; baseline 1)
FAIL kernel.sysrq 4 (a-lower.conf; baseline 0)
PASS kernel.dmesg_restrict 1 (default; baseline 1)" \
  "files read in byte order of names (9 after 10, upper case before lower), last value wins, only names ending in .conf"
assert_eq "$status" "1" "exit status when a setting fails"
