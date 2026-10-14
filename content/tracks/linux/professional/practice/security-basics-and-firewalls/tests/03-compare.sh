mkdir -p t3/usr/bin t3/usr/lib/openssh t3/home/ana/.local/bin t3/home/ana/Desktop
touch t3/usr/bin/{at,crontab,newgrp,ping,wall} t3/usr/lib/openssh/ssh-keysign
touch t3/home/ana/.local/bin/update t3/home/ana/Desktop/Update
chmod 4755 t3/usr/bin/at t3/usr/bin/newgrp t3/usr/lib/openssh/ssh-keysign
chmod 4755 t3/home/ana/.local/bin/update t3/home/ana/Desktop/Update
chmod 2755 t3/usr/bin/crontab
chmod 0755 t3/usr/bin/ping
chmod 4711 t3/usr/bin/wall
cat > baseline.txt <<'EOF'
# audit of 2 September 2026

4755 t3/usr/bin/at
6755 t3/usr/bin/crontab
4755 t3/usr/bin/fusermount3
4755 t3/usr/bin/newgrp
4755 t3/usr/bin/ping
2755 t3/usr/bin/wall
4755 t3/usr/lib/openssh/ssh-keysign
EOF

assert_eq "$(bash solution.sh t3 baseline.txt)" "new: t3/home/ana/.local/bin/update (4755)
new: t3/home/ana/Desktop/Update (4755)
changed: t3/usr/bin/crontab (6755 -> 2755)
changed: t3/usr/bin/wall (2755 -> 4711)
gone: t3/usr/bin/fusermount3
gone: t3/usr/bin/ping" \
  "the three groups in order, sorted by path, with unchanged files left out"
