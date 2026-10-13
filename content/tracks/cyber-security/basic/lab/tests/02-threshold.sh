cat > threshold.log <<'LOG'
Oct 13 10:00:01 db02 sshd[101]: Failed password for root from 10.0.0.2 port 1001 ssh2
Oct 13 10:00:02 db02 sshd[101]: Failed password for root from 10.0.0.2 port 1002 ssh2
Oct 13 10:00:03 db02 sshd[102]: Failed password for root from 10.0.0.3 port 1003 ssh2
Oct 13 10:00:04 db02 sshd[102]: Failed password for invalid user pi from 10.0.0.3 port 1004 ssh2
Oct 13 10:00:05 db02 sshd[102]: Failed password for invalid user pi from 10.0.0.3 port 1005 ssh2
Oct 13 10:00:06 db02 sshd[103]: Accepted password for ops from 10.0.0.9 port 1006 ssh2
Oct 13 10:00:07 db02 sshd[103]: Accepted password for ops from 10.0.0.9 port 1007 ssh2
Oct 13 10:00:08 db02 sshd[103]: Accepted password for ops from 10.0.0.9 port 1008 ssh2
Oct 13 10:00:09 db02 sshd[103]: Accepted password for ops from 10.0.0.9 port 1009 ssh2
LOG

actual=$(bash solution.sh threshold.log) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "10.0.0.3 3" \
  "an address with exactly 3 failures is reported, one with 2 is not, and successful logins are never counted"
