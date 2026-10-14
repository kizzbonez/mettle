mkdir -p t2/opt/tool t2/srv/shared t2/usr/bin
touch t2/opt/tool/{setgid-only,both,no-exec,sticky,plain} t2/usr/bin/real
chmod 2711 t2/opt/tool/setgid-only
chmod 6755 t2/opt/tool/both
chmod 4644 t2/opt/tool/no-exec
chmod 1755 t2/opt/tool/sticky
chmod 0755 t2/opt/tool/plain
chmod 2775 t2/srv/shared
chmod 4755 t2/usr/bin/real
ln -s real t2/usr/bin/link-to-real
printf '# nothing was setuid before\n\n' > empty-baseline.txt

actual=$(bash solution.sh t2 empty-baseline.txt)
status=$?
assert_eq "$actual" "new: t2/opt/tool/both (6755)
new: t2/opt/tool/no-exec (4644)
new: t2/opt/tool/setgid-only (2711)
new: t2/usr/bin/real (4755)" \
  "setuid, setgid and both, without execute bits, but no sticky-only files, directories or links"
assert_eq "$status" "1" "exit status when there are new files"
