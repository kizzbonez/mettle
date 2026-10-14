---
title: Here-Documents and Subshells
summary: Feed text to commands with here-documents and here-strings, capture output with command substitution, know which constructs run in a subshell and which in the current shell, and pass a command's output as a file with process substitution.
minutes: 25
objectives:
  - Write a here-document with and without expansion, and a here-string, and predict what each sends to the command
  - Explain what command substitution removes from the captured output
  - Predict whether a variable or directory change survives `( )`, `{ }`, a pipeline and `$( )`
  - Use process substitution to compare two command outputs and to read a command's output in a loop without losing variables
---

## Outline

1. Here-documents
2. Here-strings
3. Command substitution
4. Subshells and the current shell
5. Pipelines run in subshells
6. Process substitution

## Here-documents

A **here-document** gives a command several lines of standard input written right in the script. `cmd <<WORD` reads the following lines until a line that contains only `WORD`, and feeds them to `cmd`. The delimiter can be any word; `EOF` and `EOT` are common.

Quoting the delimiter decides whether the text is expanded:

- `<<EOT` (unquoted): `$variables`, `$(commands)` and `$((arithmetic))` inside are expanded, like in double quotes. Ideal for templates.
- `<<'EOT'` (any part quoted): the text is passed exactly as written. Use it for text full of `$`, such as a script you are generating.

```bash
host=web01 port=8080
cat <<EOT
server $host listens on port $port
the next port is $((port + 1)), the shell is $(basename "$BASH")
EOT
cat <<'EOT'
taken literally: $host $(date) \n
EOT
```

```text
server web01 listens on port 8080
the next port is 8081, the shell is bash
taken literally: $host $(date) \n
```

Here-documents are how scripts write configuration files (`cat > app.conf <<EOF`) and print long usage messages. The form `<<-EOT` also strips leading **tab** characters (not spaces) from each line and from the delimiter line, so the text can be indented inside a function. Because editors often turn tabs into spaces, many people simply keep here-documents unindented.

## Here-strings

A **here-string**, `cmd <<< "text"`, is the one-line version: the expanded word plus a newline becomes standard input. It saves an `echo ... |` and, unlike a pipe, does not put `cmd` in a subshell.

```bash
read -r first rest <<< "alpha beta gamma"
echo "first=$first rest=$rest"
wc -c <<< "abc"
```

```text
first=alpha rest=beta gamma
4
```

`wc` counted four bytes: the three letters and the newline the here-string adds.

## Command substitution

**Command substitution**, `$(commands)`, runs the commands and replaces itself with their standard output. Two details matter. First, **all trailing newlines are removed**, which is why a captured one-line answer has no newline at the end, and also why blank lines at the end of captured text vanish. Second, the result is subject to word splitting and globbing like any expansion, so quote it: `"$(cmd)"`. Each `$( )` starts a new quoting context, so quotes inside it do not clash with quotes outside.

```bash
out=$(printf 'line one\nline two\n\n\n')
printf '[%s]\n' "$out"
hosts=$(< hosts.txt)
echo "nested: $(basename "$(dirname /srv/app/current/bin)")"
```

```text
[line one
line two]
nested: current
```

`$(< file)` is a fast form of `$(cat file)` that Bash handles itself. The old backtick syntax, `` `cmd` ``, does the same thing but cannot nest without escaping; prefer `$( )`.

## Subshells and the current shell

A **subshell** is a copy of the shell, made as a separate process. It starts with copies of all variables, functions and the current directory, but nothing it changes comes back to the parent. Several constructs create one:

- `( commands )`: an explicit subshell.
- `$( commands )`: command substitution.
- every command of a pipeline (more below).
- `commands &`: a background job.

`{ commands; }` looks similar but **groups** commands in the *current* shell: no copy, so changes persist. It needs spaces inside the braces and a `;` or newline before `}`. Both forms let you redirect a group's output at once. `BASH_SUBSHELL` counts how deep in subshells you are.

```bash
cd /work
x=outside
( cd /tmp; x=inside; echo "in ( ): PWD=$PWD x=$x level=$BASH_SUBSHELL" )
echo "after ( ): PWD=$PWD x=$x"
{ cd /tmp; x=inside; echo "in { }: level=$BASH_SUBSHELL"; }
echo "after { }: PWD=$PWD x=$x"
( exit 3 )
echo "( exit 3 ) only ended the subshell: status $?"
cd /work
{ echo "# hosts"; sort -r hosts.txt; } > report.txt
cat report.txt
```

```text
in ( ): PWD=/tmp x=inside level=1
after ( ): PWD=/work x=outside
in { }: level=0
after { }: PWD=/tmp x=inside
( exit 3 ) only ended the subshell: status 3
# hosts
web02
web01
```

Use `( )` on purpose when you want changes contained: `(cd "$dir" && make)` builds in another directory without moving the script. Use `{ }` to group commands for one redirection or one `||`, as in `cd "$dir" || { echo "cannot enter $dir" >&2; exit 1; }`.

## Pipelines run in subshells

In Bash each command of a pipeline runs in its own subshell. That includes a `while read` loop on the right of a `|`, so anything the loop sets is lost when the pipeline ends. This is one of the most reported Bash surprises.

```bash
count=0
printf 'a\nb\nc\n' | while read -r line; do count=$((count + 1)); done
echo "after a pipe: count=$count"
while read -r line; do count=$((count + 1)); done < <(printf 'a\nb\nc\n')
echo "after process substitution: count=$count"
```

```text
after a pipe: count=0
after process substitution: count=3
```

The second loop runs in the current shell and reads from a **process substitution**, explained next. (`shopt -s lastpipe` is another fix: it runs the last command of a pipeline in the current shell when job control is off, as it is in scripts.)

## Process substitution

**Process substitution** runs a command and hands you a *file name* connected to it. `<(cmd)` gives a name you can read `cmd`'s output from; `>(cmd)` gives a name whose contents are written to `cmd`'s input. On Linux the name is a path such as `/dev/fd/63`. The command runs in the background, at the same time as the command that reads it. There must be no space between `<` and `(`.

It shines with commands that want file names, such as `diff` and `comm`, when the data comes from other commands.

```bash
diff <(sort before.txt) <(sort after.txt)
echo "diff exit status: $?"
echo "the shell passed diff these names: " <(true) <(true)
```

```text
3c3
< web02
---
> web03
diff exit status: 1
the shell passed diff these names:  /dev/fd/63 /dev/fd/62
```

No temporary files were created and nothing needs deleting. The exact `/dev/fd` numbers can differ. One limit: the exit status of the command inside `<( )` is not visible to the script, so if it may fail, check that separately.

## Common mistakes

- **Expecting variables set in `cmd | while read` to survive.** Use `done < <(cmd)`.
- **Indenting the closing delimiter with spaces.** The delimiter line must be exactly the word (or tabs, with `<<-`).
- **An unquoted here-document for text containing `$`**, which is then expanded.
- **Calling `exit` in `( )` or `$( )` and expecting the script to stop.**
- **Writing `{cmd}` or `{ cmd }`.** The braces need spaces and a final `;`.

## Practice

1. Write a here-document that creates `motd.txt` containing `Welcome to <hostname>` using the variable `host`, and a second line `Use $HOME for your files` with `$HOME` left as written.
2. Why does `cd /tmp | ls` not list `/tmp`?
3. Print the lines that are in `users.txt` but not in `active.txt`, neither file being sorted, without temporary files.

### Answers

1. One literal `$` in an expanded here-document needs a backslash:

   ```bash
   cat > motd.txt <<EOF
   Welcome to $host
   Use \$HOME for your files
   EOF
   ```

2. Each side of the pipe is a separate subshell, so the `cd` changes only its own copy. Also, `ls` does not read standard input. Use `cd /tmp && ls`, or `(cd /tmp && ls)` to leave the script where it was.
3. `comm -23 <(sort users.txt) <(sort active.txt)`. `comm` needs sorted files; process substitution supplies them.

## Key takeaways

- `<<EOT` expands, `<<'EOT'` does not; `<<<` sends one string plus a newline.
- `$( )` captures output minus trailing newlines; quote it.
- `( )`, `$( )`, pipelines and `&` run in subshells, whose changes are lost; `{ ...; }` runs in the current shell.
- `<(cmd)` turns a command's output into a file name, and `done < <(cmd)` keeps a loop's variables.

## Further reading

- [Bash Reference Manual (Chet Ramey's copy): Here Documents](https://tiswww.case.edu/php/chet/bash/bashref.html#Here-Documents)
- [Bash Reference Manual (Chet Ramey's copy): Process Substitution](https://tiswww.case.edu/php/chet/bash/bashref.html#Process-Substitution)
- [Greg's Wiki: BashFAQ 24, variables set in a loop that reads from a pipe](https://mywiki.wooledge.org/BashFAQ/024)
