mkdir -p "t4/var/tmp/.. " t4/usr/bin
touch "t4/var/tmp/.. /sh" t4/usr/bin/sudo "t4/usr/bin/sudo edit"
chmod 4755 "t4/var/tmp/.. /sh" t4/usr/bin/sudo "t4/usr/bin/sudo edit"
cat > baseline.txt <<'EOF'
4755 t4/usr/bin/sudo
4755 t4/usr/bin/sudo edit
EOF
assert_eq "$(bash solution.sh t4 baseline.txt)" "new: t4/var/tmp/.. /sh (4755)" \
  "paths that contain spaces, now and in the baseline"

mkdir -p clean/bin clean/shared
touch clean/bin/passwd
chmod 4755 clean/bin/passwd
chmod 2775 clean/shared
printf '4755 clean/bin/passwd\n' > clean-baseline.txt
actual=$(bash solution.sh clean clean-baseline.txt)
status=$?
assert_eq "$actual" "no changes" "a tree that matches its baseline"
assert_eq "$status" "0" "exit status when nothing changed"
