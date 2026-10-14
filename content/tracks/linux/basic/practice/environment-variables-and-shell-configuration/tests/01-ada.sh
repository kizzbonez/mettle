# This test makes the folder race1 with the badge program in race1/tools.
# badge prints the badge line from RUNNER and BIB, and logs it in badges.log.
mkdir -p race1/tools
cat > race1/tools/badge << 'EOF'
#!/bin/sh
echo "BADGE ${RUNNER:-?} #${BIB:-?}"
echo "${RUNNER:-?} ${BIB:-?}" >> badges.log
EOF
chmod +x race1/tools/badge

# Then it goes into race1, runs your script there with two arguments, and
# shows you what it printed.
script="$PWD/solution.sh"
cd race1 || fail "could not go into race1"
unset RUNNER BIB
printed=$(bash "$script" "Ada Lovelace" 42 2> ../errors1.txt)

echo "Your script printed:"
echo "$printed"
echo
echo "On standard error:"
cat ../errors1.txt
echo

expected='Runner: Ada Lovelace
Bib: 42
BADGE Ada Lovelace #42
Badges printed today: 1'
assert_eq "$printed" "$expected" "what the script printed for: bash solution.sh \"Ada Lovelace\" 42"
assert_eq "$(cat ../errors1.txt)" "" "what the script printed on standard error"
