# .log files at several depths with spaces in their names, and other files
# full of ERROR lines that must not be counted.
mkdir -p 'logs-tree/node a' logs-tree/deep/er
printf 'ok\nERROR one\nok\nERROR two\n' > 'logs-tree/node a/run 1.log'
printf 'ERROR\nERROR\nERROR\nERROR\nERROR\n' > 'logs-tree/node a/run 1.log.1'
printf 'ERROR in the summary\n' > logs-tree/summary.txt
printf 'ERROR in capitals, but the name ends in .LOG\n' > logs-tree/OLD.LOG
printf 'ERROR first\nERROR at the end, no newline' > logs-tree/deep/er/x.log
printf 'error in lower case\n' > logs-tree/lower.log

actual=$(bash solution.sh logs-tree) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'errors: 4' "the ERROR lines counted in .log files only, at any depth, with spaces in their names"
