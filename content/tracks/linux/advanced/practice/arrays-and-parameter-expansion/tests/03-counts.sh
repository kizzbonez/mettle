# Mixed-case extensions, blank lines and a last line without a newline.
printf 'a.WAV\nb.wav\n\nc.Wav\nd.flac\n\n\ne.FLAC\nREADME' > mixed.txt
out=$(env -u PREFIX bash solution.sh mixed.txt)
assert_eq "$?" "0" "exit status for a list with blank lines"
assert_eq "$out" "a.WAV -> a.wav
b.wav -> b.wav
c.Wav -> c.wav
d.flac -> d.flac
e.FLAC -> e.flac
README -> readme
(none): 1
flac: 2
wav: 3" "extensions counted in lower case, blank lines skipped and the last line read"

: > empty.txt
out=$(env -u PREFIX bash solution.sh empty.txt)
assert_eq "$?" "0" "exit status for an empty list"
assert_eq "$out" "" "output for an empty list"

printf '\n\n\n' > blank.txt
out=$(env -u PREFIX bash solution.sh blank.txt)
assert_eq "$?" "0" "exit status for a list of blank lines"
assert_eq "$out" "" "output for a list of blank lines"
