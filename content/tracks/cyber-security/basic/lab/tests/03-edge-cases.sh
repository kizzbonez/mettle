cat > quiet.log <<'LOG'
Oct 13 11:00:01 db02 sshd[201]: Accepted publickey for ops from 10.0.0.9 port 2001 ssh2
Oct 13 11:00:02 db02 sshd[202]: Failed password for root from 10.0.0.5 port 2002 ssh2
LOG

actual=$(bash solution.sh quiet.log) || fail "a log with no offenders must still exit with status 0"
assert_eq "$actual" "" "a log with no offenders prints nothing"

{
  for port in 1 2 3; do echo "Oct 13 12:00:0$port db02 sshd[301]: Failed password for root from 172.16.0.9 port 300$port ssh2"; done
  for port in 1 2 3 4; do echo "Oct 13 12:01:0$port db02 sshd[302]: Failed password for root from 172.16.0.20 port 310$port ssh2"; done
  for port in 1 2 3; do echo "Oct 13 12:02:0$port db02 sshd[303]: Failed password for invalid user git from 172.16.0.10 port 320$port ssh2"; done
} > ties.log

expected='172.16.0.20 4
172.16.0.10 3
172.16.0.9 3'

actual=$(bash solution.sh ties.log) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "highest count first; equal counts ordered by address"
