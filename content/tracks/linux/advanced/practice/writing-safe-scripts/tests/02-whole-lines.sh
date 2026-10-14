mkdir -p ro2 'mail relay'
chmod 555 ro2
export TMPDIR=$PWD/ro2
list='mail relay/allow list.txt'
printf '%s\n' web01 axb ops -v 'C:\temp' > "$list"
# Files that an unquoted * or [abc] would turn into other names.
touch a b c

out=$(bash solution.sh "$list" web a.b -v 'ops team' '*' ops '[abc]' 'C:\temp' web 2> err2.txt)
assert_eq "$?" "0" "exit status for entries that are parts of lines, patterns and options"
assert_eq "$out" "added web
added a.b
added ops team
added *
added [abc]
5 added" "the entries reported as added, each compared as a whole line of fixed text"
assert_eq "$(cat "$list")" 'web01
axb
ops
-v
C:\temp
web
a.b
ops team
*
[abc]' "the allowlist in a directory with a space, after adding the new entries"

out=$(bash solution.sh "mail relay/new list.txt" one -n one 2> err2.txt)
assert_eq "$?" "0" "exit status when LIST does not exist yet"
assert_eq "$out" "added one
added -n
2 added" "the output when LIST does not exist yet"
assert_eq "$(cat "mail relay/new list.txt")" "one
-n" "the new allowlist created from nothing"
