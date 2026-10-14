mkdir -p race3/tools
cat > race3/tools/badge << 'EOF'
#!/bin/sh
echo "BADGE ${RUNNER:-?} #${BIB:-?}"
echo "${RUNNER:-?} ${BIB:-?}" >> badges.log
EOF
chmod +x race3/tools/badge
printf 'Ana Silva 3\nBen Okafor 17\nChloe Martin 25\n' > race3/badges.log

script="$PWD/solution.sh"
cd race3 || fail "could not go into race3"
unset RUNNER BIB
printed=$(bash "$script" "Kofi Mensah" 118 2> /dev/null)

assert_eq "$(printf '%s\n' "$printed" | grep '^BADGE')" "BADGE Kofi Mensah #118" "the badge line printed by the badge program (it reads RUNNER and BIB from its environment)"
assert_eq "$(tail -n 1 badges.log)" "Kofi Mensah 118" "the line the badge program added to badges.log"
assert_eq "$(printf '%s\n' "$printed" | tail -n 1)" "Badges printed today: 4" "the last line printed when badges.log already held three badges"
