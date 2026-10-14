---
title: Arrays and Parameter Expansion
summary: Hold lists in indexed arrays and lookups in associative arrays, expand them safely with `"${array[@]}"`, and use parameter expansion to supply defaults, demand required values, and trim, replace and slice strings without starting a single extra process.
minutes: 30
objectives:
  - Create, extend, loop over and delete from indexed arrays, and explain why `"${array[@]}"` must be quoted
  - Use an associative array as a lookup table and a counter, and check whether a key exists
  - Supply defaults and required values with `${var:-x}`, `${var:=x}` and `${var:?message}`, and explain what the colon changes
  - Trim, replace, measure and slice strings with `#`, `%`, `/`, `${#var}` and `${var:offset:length}`
---

## Outline

1. Why a string is not a list
2. Indexed arrays
3. Building arrays
4. Associative arrays
5. Defaults and required values
6. Trimming, replacing and slicing

## Why a string is not a list

A common first attempt at a list is a string: `files="a.txt b.txt"`, used as `$files` without quotes so that the shell splits it. It breaks the day a file is called `report 2026.txt`, because splitting cannot tell the space *in* a name from the space *between* names. An **array** is a variable that holds many separate strings, each kept whole whatever it contains. Whenever you need a list of file names, hosts or command arguments, use one.

## Indexed arrays

An **indexed array** numbers its elements from 0. Create one with `name=(one two three)`, read one element with `${name[i]}`, and count them with `${#name[@]}`. A negative index counts from the end, so `${name[-1]}` is the last element.

To expand every element, write `"${name[@]}"` with the quotes. It produces one word per element, exactly like `"$@"` for arguments. `"${name[*]}"` instead joins all elements into one string, separated by a space.

```bash
files=("report 2026.txt" notes.md "a*b.log")
echo "count: ${#files[@]}"
echo "first: ${files[0]}, last: ${files[-1]}"
echo "quoted @:"
printf '  <%s>\n' "${files[@]}"
echo "unquoted @:"
printf '  <%s>\n' ${files[@]}
echo "quoted *: <${files[*]}>"
```

```text
count: 3
first: report 2026.txt, last: a*b.log
quoted @:
  <report 2026.txt>
  <notes.md>
  <a*b.log>
unquoted @:
  <report>
  <2026.txt>
  <notes.md>
  <a*b.log>
quoted *: <report 2026.txt notes.md a*b.log>
```

Unquoted, the first name split in two, and `a*b.log` was treated as a **glob** (a wildcard pattern). It survived only because no file matched it. In a directory with `aXb.log` it would have turned into that name.

## Building arrays

`name+=(more items)` appends. `mapfile -t name < file` (also spelled `readarray`) reads a file into an array, one line per element; `-t` removes each line's newline. `unset 'name[i]'` deletes one element; quote it, or the shell may treat `name[i]` as a glob. Deleting does not renumber the rest, so arrays can be **sparse**, with gaps. `${!name[@]}` lists the indices that actually exist, which is the safe way to loop when you need positions.

```bash
mapfile -t hosts < hosts.txt     # web01, web02, db01
hosts+=(cache01)
unset 'hosts[1]'
echo "${#hosts[@]} hosts at indices: ${!hosts[*]}"
for i in "${!hosts[@]}"; do
  echo "  $i: ${hosts[i]}"
done
echo "slice: ${hosts[*]:1:2}"
```

```text
3 hosts at indices: 0 2 3
  0: web01
  2: db01
  3: cache01
slice: db01 cache01
```

`${hosts[*]:1:2}` takes two elements starting from index 1. Index 1 no longer exists, so the slice begins at the next element, index 2. Inside `[ ]` the index is arithmetic, so `${hosts[i]}` needs no `$` on `i`.

## Associative arrays

An **associative array** is indexed by strings instead of numbers, which makes it a lookup table: host to owner, word to count. It must be declared with `declare -A` before use (inside a function, `local -A` works too). The keys come back in no particular order, so sort them if order matters.

```bash
declare -A owner=([web01]=ana [db01]="li wei")
owner[cache01]=sam
owner[web01]=joe
echo "${#owner[@]} entries"
for host in "${!owner[@]}"; do
  printf '%s=%s\n' "$host" "${owner[$host]}"
done | sort
if [[ -v owner[db01] ]]; then echo "db01 has an owner"; fi
echo "mail01: ${owner[mail01]:-nobody}"

declare -A seen=()
for word in red blue red green red; do
  seen[$word]=$(( ${seen[$word]:-0} + 1 ))
done
echo "red was seen ${seen[red]} times"

colors[red]=1
colors[blue]=2
declare -p colors
```

```text
3 entries
cache01=sam
db01=li wei
web01=joe
db01 has an owner
mail01: nobody
red was seen 3 times
declare -a colors=([0]="2")
```

Assigning to an existing key replaces its value. `[[ -v owner[db01] ]]` tests whether a key exists. The counter reads the current value with a default of 0 and stores the sum. The last three lines show the classic mistake: without `declare -A`, `colors` became an *indexed* array, the words `red` and `blue` were evaluated as arithmetic (unset variables count as 0), and both assignments landed on index 0. `declare -p` prints any variable's type and contents, which makes it the quickest way to see what you really have.

## Defaults and required values

**Parameter expansion** is the `${...}` syntax, and it does much more than fetch a value. Four forms deal with missing values:

| Form | When `var` is unset or empty |
| --- | --- |
| `${var:-word}` | use `word`, leave `var` alone |
| `${var:=word}` | assign `word` to `var`, then use it |
| `${var:?message}` | print `message` to standard error and exit a script |
| `${var:+word}` | use nothing; when `var` *has* a value, use `word` |

The colon makes the test "unset **or empty**". Without it, only an unset variable counts, so `${var-word}` keeps an empty value.

```bash
empty=""
echo "port: ${PORT:-8080}"
echo "empty with colon: ${empty:-fallback}"
echo "empty without colon: [${empty-fallback}]"
: "${RETRIES:=3}"
echo "retries now set to $RETRIES"
echo "${TARGET:?set TARGET to the host to deploy to}"
echo "not reached"
```

Saved as `defaults.sh` and run with `bash defaults.sh; echo "status $?"`:

```text
port: 8080
empty with colon: fallback
empty without colon: []
retries now set to 3
defaults.sh: line 7: TARGET: set TARGET to the host to deploy to
status 1
```

`:` is a command that does nothing, so `: "${RETRIES:=3}"` exists only for its side effect of assigning. Run as `PORT=9000 TARGET=web01 bash defaults.sh` and the script uses 9000 and reaches the end. This is how scripts take settings from the environment with sensible defaults.

## Trimming, replacing and slicing

These forms work on a copy of the value, using the same patterns as file globs (`*`, `?`, `[...]`), and run inside Bash, so they are much faster than calling `basename`, `sed` or `cut` in a loop.

- `${var#pattern}` removes the shortest match from the start, `${var##pattern}` the longest.
- `${var%pattern}` removes the shortest match from the end, `${var%%pattern}` the longest.
- `${var/pattern/text}` replaces the first match; `${var//pattern/text}` replaces all.
- `${#var}` is the length; `${var:offset:length}` is a substring.
- `${var,,}` lowercases and `${var^^}` uppercases.

```bash
path=/var/log/nginx/access.log.2.gz
echo "${path##*/}"
echo "${path%/*}"
echo "${path#*.}"
echo "${path%%.*}"
echo "${path%.gz}"
title="Quarterly Report 2026"
echo "${title// /_}"
echo "${title/Report/Summary}"
echo "${#title} characters, first 9: ${title:0:9}, last 4: ${title: -4}"
echo "${title,,} | ${title^^}"
```

```text
access.log.2.gz
/var/log/nginx
log.2.gz
/var/log/nginx/access
/var/log/nginx/access.log.2
Quarterly_Report_2026
Quarterly Summary 2026
21 characters, first 9: Quarterly, last 4: 2026
quarterly report 2026 | QUARTERLY REPORT 2026
```

A memory aid: on a keyboard `#` is left of `$` and `%` is right of it, so `#` trims the left and `%` the right. Note the space in `${title: -4}`. Without it, `${title:-4}` is the default form and prints the whole title.

## Common mistakes

- **Unquoted `${array[@]}`**, which splits and globs every element. ShellCheck calls this SC2068.
- **Using an associative array without `declare -A`.**
- **`${var:-4}` when you meant `${var: -4}`.**
- **Storing a list in a string** and relying on word splitting to take it apart.
- **Expecting associative keys in insertion order.**

## Practice

1. Given `file=backup-2026-10-14.tar.gz`, print `backup-2026-10-14` and then `tar.gz`.
2. Put the arguments of a script into an array, add `--verbose` to the front, and pass them all to `rsync` intact.
3. Count how many lines of `access.log` come from each IP address (the first field) with an associative array, and print `IP count` lines sorted by IP.

### Answers

1. `${file%%.*}` removes the longest `.*` from the end, leaving `backup-2026-10-14`; `${file#*.}` removes the shortest `*.` from the start, leaving `tar.gz`.
2. `args=(--verbose "$@")` then `rsync "${args[@]}"`. Both quoted forms keep every argument as one word.
3. Read each line with `read -r`, which splits off the first field, and count:

   ```bash
   declare -A hits=()
   while read -r ip _; do
     hits[$ip]=$(( ${hits[$ip]:-0} + 1 ))
   done < access.log
   for ip in "${!hits[@]}"; do echo "$ip ${hits[$ip]}"; done | sort
   ```

## Key takeaways

- Arrays keep each element whole; strings split on spaces do not.
- Always expand with `"${array[@]}"`; use `${!array[@]}` for indices or keys and `${#array[@]}` for the count.
- Associative arrays need `declare -A` and have no order.
- `:-`, `:=`, `:?` and `:+` handle missing values; the colon includes empty ones.
- `#`, `%`, `/`, `${#var}` and `${var:offset:length}` edit strings without extra processes.

## Further reading

- [GNU Bash manual: Shell Parameter Expansion](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html)
- [Bash Reference Manual (Chet Ramey's copy): Arrays](https://tiswww.case.edu/php/chet/bash/bashref.html#Arrays)
- [ShellCheck wiki: SC2068, double quote array expansions](https://www.shellcheck.net/wiki/SC2068)
