cat > passwd <<'EOF'
root:x:0:0:root:/root:/bin/bash
anabel:x:1002:1002:Anabel Ortiz,,,:/home/anabel:/bin/bash
an:x:1005:1005:An Nguyen,,,:/home/an:/bin/bash
ana:x:1000:1000:Ana Reyes,,,:/home/ana:/bin/bash
EOF
cat > group <<'EOF'
root:x:0:
ana-admins:x:1020:anabel
anabel:x:1002:
an:x:1005:
ana:x:1000:
docker:x:996:anabel,ana,an
plans:x:1010:anabel
backup:x:34:ana
EOF

assert_eq "$(bash solution.sh passwd group ana)" \
  "uid=1000(ana) gid=1000(ana) groups=1000(ana),996(docker),34(backup)" \
  "a user whose name is part of other user and group names, groups in file order"
assert_eq "$(bash solution.sh passwd group an)" \
  "uid=1005(an) gid=1005(an) groups=1005(an),996(docker)" \
  "a short user name listed last in a member list"
assert_eq "$(bash solution.sh passwd group anabel)" \
  "uid=1002(anabel) gid=1002(anabel) groups=1002(anabel),1020(ana-admins),996(docker),1010(plans)" \
  "a user listed first in a member list and alone in another"
