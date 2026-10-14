printf '%s\n' '/srv/studio/Ep 15 Outro.WAV' 'README' > short.txt

out=$(PREFIX=s02 bash solution.sh short.txt)
assert_eq "$out" "Ep 15 Outro.WAV -> s02-ep_15_outro.wav
README -> s02-readme
(none): 1
wav: 1" "new names when PREFIX is set"

out=$(PREFIX= bash solution.sh short.txt)
assert_eq "$out" "Ep 15 Outro.WAV -> ep_15_outro.wav
README -> readme
(none): 1
wav: 1" "new names when PREFIX is set but empty"

out=$(env -u PREFIX bash solution.sh 2> err.txt)
assert_eq "$?" "1" "exit status when LIST is missing"
assert_eq "$out" "" "nothing on standard output when LIST is missing"
grep -q 'usage: solution.sh LIST$' err.txt \
  || fail "the message on standard error when LIST is missing"

out=$(env -u PREFIX bash solution.sh "" 2> err.txt)
assert_eq "$?" "1" "exit status when LIST is an empty string"
assert_eq "$out" "" "nothing on standard output when LIST is an empty string"
grep -q 'usage: solution.sh LIST$' err.txt \
  || fail "the message on standard error when LIST is an empty string"
