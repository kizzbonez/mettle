mkdir -p race2/tools
cat > race2/tools/badge << 'EOF'
#!/bin/sh
echo "BADGE ${RUNNER:-?} #${BIB:-?}"
echo "${RUNNER:-?} ${BIB:-?}" >> badges.log
EOF
chmod +x race2/tools/badge

script="$PWD/solution.sh"
cd race2 || fail "could not go into race2"
unset RUNNER BIB
printed=$(bash "$script" "Mary  Jane O'Neil" 007 2> /dev/null)

assert_eq "$(printf '%s\n' "$printed" | head -n 2)" "Runner: Mary  Jane O'Neil
Bib: 007" "the Runner and Bib lines for a name with two spaces in a row and an apostrophe, and a bib with a leading zero"
