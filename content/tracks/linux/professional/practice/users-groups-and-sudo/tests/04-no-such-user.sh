cat > group <<'EOF'
lee:x:1001:
plans:x:1010:ghost,lee
EOF

out=$(bash solution.sh data/passwd group ghost 2> err.txt)
status=$?
assert_eq "$out" "" "standard output for a user who is only left in a member list"
assert_eq "$(cat err.txt)" "id: 'ghost': no such user" "the message on standard error for a missing user"
assert_eq "$status" "1" "exit status for a missing user"

out=$(bash solution.sh data/passwd group le 2> err.txt)
status=$?
assert_eq "$out$(cat err.txt)" "id: 'le': no such user" "a name that is only the start of an existing user name"
assert_eq "$status" "1" "exit status for a name that is only the start of a user name"
