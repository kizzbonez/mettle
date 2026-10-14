mkdir -p c3
flag=$PWD/c3-flag
rm -f "$flag"

# 1-wait passes only if 2-flag runs while it is still waiting (at most 2 seconds).
cat > c3/1-wait.sh <<EOF
for _ in \$(seq 1 100); do
  [[ -e "$flag" ]] && exit 0
  sleep 0.02
done
exit 1
EOF
cat > c3/2-flag.sh <<EOF
: > "$flag"
EOF
printf 'exit 4\n' > c3/3-fast.sh

out=$(bash solution.sh c3 2> err3.txt)
status=$?
assert_eq "$out" "1-wait ok
2-flag ok
3-fast failed (status 4)
2 of 3 checks passed" "the result lines when the checks run at the same time and are reported in name order"
assert_eq "$status" "1" "exit status when one check failed"
