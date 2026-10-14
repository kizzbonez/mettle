mkdir -p race4/tools race4/decoy
cat > race4/tools/badge << 'EOF'
#!/bin/sh
echo "BADGE ${RUNNER:-?} #${BIB:-?}"
echo "${RUNNER:-?} ${BIB:-?}" >> badges.log
EOF
printf '#!/bin/sh\necho "a badge from the wrong program"\n' > race4/decoy/badge
chmod +x race4/tools/badge race4/decoy/badge

script="$PWD/solution.sh"
cd race4 || fail "could not go into race4"
unset RUNNER BIB
printed=$(PATH="$PWD/decoy:$PATH" bash "$script" "Lena Fischer" 9 2> ../errors4.txt) || fail "solution.sh finished with a non-zero exit status"

assert_eq "$printed" "Runner: Lena Fischer
Bib: 9
BADGE Lena Fischer #9
Badges printed today: 1" "what the script printed when another badge program came earlier in PATH"
assert_eq "$(cat ../errors4.txt)" "" "what the script printed on standard error"
