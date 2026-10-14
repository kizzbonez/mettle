# waiter.sh succeeds only if partner.sh runs while it is waiting. It gives up
# after about three seconds, so jobs run one after another make it fail.
mkdir -p linked-jobs
rm -f together.flag
cat > linked-jobs/waiter.sh << 'EOF'
for i in $(seq 30); do
  if [ -e together.flag ]; then
    exit 0
  fi
  sleep 0.1
done
exit 9
EOF
printf 'touch together.flag\n' > linked-jobs/partner.sh

actual=$(bash solution.sh linked-jobs/waiter.sh linked-jobs/partner.sh 2> /dev/null)
status=$?
assert_eq "$actual" 'ok: 2
failed: 0
worst: 0' "jobs that need each other: every job must be started before waiting for any"
assert_eq "$status" "0" "exit status when jobs that need each other both succeed"
