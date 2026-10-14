mkdir -p c4
pidfile=$PWD/c4-slow.pid
rm -f "$pidfile"

# The slow check records its process id, then becomes a long sleep.
cat > c4/a-slow.sh <<EOF
printf '%s\n' "\$\$" > "$pidfile"
exec sleep 20
EOF
printf 'exit 0\n' > c4/b-quick.sh

# still_running PID: succeed when PID is a live process (not gone, not a zombie).
still_running() {
  local state
  state=$(ps -o stat= -p "$1" 2> /dev/null) || return 1
  [[ -n $state && $state != Z* ]]
}

bash solution.sh c4 > out4.txt 2> err4.txt &
pid=$!

# Wait until the slow check has started (at most 3 seconds); no fixed delay.
for _ in $(seq 1 150); do
  [[ -s $pidfile ]] && break
  sleep 0.02
done
if [[ ! -s $pidfile ]]; then
  kill -s KILL "$pid" 2> /dev/null
  fail "the checks are started in the background with bash FILE &"
fi
child=$(cat "$pidfile")

kill -s TERM "$pid"
wait "$pid"
status=$?

for _ in $(seq 1 50); do
  still_running "$child" || break
  sleep 0.02
done
if still_running "$child"; then
  kill -s KILL "$child" 2> /dev/null
  fail "a check that is still running is stopped when the script receives TERM"
fi
assert_eq "$status" "143" "exit status after the script receives TERM"
grep -qx 'preflight: interrupted' err4.txt \
  || fail "the message on standard error after the script receives TERM"
