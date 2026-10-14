actual=$(bash solution.sh data/passwd data/group ana)
status=$?
assert_eq "$actual" "uid=1000(ana) gid=1000(ana) groups=1000(ana),100(users),996(docker),1010(plans)" \
  "the id line for ana in data/passwd and data/group"
assert_eq "$status" "0" "exit status for a user who exists"
