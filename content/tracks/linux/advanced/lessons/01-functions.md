---
title: Functions
summary: Give a group of commands a name, pass it arguments, keep its variables to itself, send results back by status or by output, and share functions between scripts through a library you source.
minutes: 25
objectives:
  - Define and call a function, and read its arguments with `$1`, `$#` and `"$@"`
  - Use `local` to stop a function's variables leaking into the rest of the script, and explain dynamic scoping
  - Choose between a return status and printed output to send a result back, and capture output with `$( )`
  - Load a library of functions with `source`, and guard a script's `main` so that it can be sourced safely
---

## Outline

1. Why scripts need functions
2. Defining and calling a function
3. Arguments
4. Local variables and scope
5. Status versus output
6. A library of functions

## Why scripts need functions

In the Medium level your scripts ran from top to bottom. That works for twenty lines. At two hundred lines the same check appears in four places, a fix reaches three of them, and nobody can see the overall plan for the detail. A **function** is a named group of commands that you define once and run, or **call**, by writing its name like any other command. Functions give a script a vocabulary: `backup_database`, `die`, `is_port`. The top of the script then reads like a summary of what it does, and each piece can be tested on its own.

A function runs inside the current shell. No new process is started, so calling one is cheap, and a function can change the shell's variables and current directory, for better or worse.

## Defining and calling a function

Bash accepts two spellings: `name() { commands; }` and `function name { commands; }`. Use the first. It is the POSIX form, so it also works in `sh`, and mixing the two (`function name() { }`) gains nothing. The braces are reserved words, so they need a space after `{` and a newline or `;` before `}`.

A definition is itself a command: Bash must have run it before the call. A call on line 1 to a function defined on line 2 fails with `command not found`. That is why scripts define their functions first and call them at the bottom.

## Arguments

Inside a function the **positional parameters** (`$1`, `$2` and so on) are the function's own arguments, not the script's. `$#` is how many there are and `"$@"` is all of them, each as a separate word. When the function returns, the script's own `$1` and friends come back. `$0` is the exception: it still names the script. The array `FUNCNAME` holds the names of the functions currently running, innermost first.

```bash
#!/usr/bin/env bash
greet() {
  printf '%s got %d argument(s)\n' "${FUNCNAME[0]}" "$#"
  local arg
  for arg in "$@"; do
    printf '  [%s]\n' "$arg"
  done
}

greet "Ada Lovelace" ops
greet
printf 'back in the script: $0=%s $1=%s\n' "$0" "$1"
```

Saved as `greet.sh` and run with `bash greet.sh first-script-arg`:

```text
greet got 2 argument(s)
  [Ada Lovelace]
  [ops]
greet got 0 argument(s)
back in the script: $0=greet.sh $1=first-script-arg
```

`"Ada Lovelace"` arrived as one argument because it was quoted at the call. Inside, `"$@"` (with the quotes) kept it as one word. Unquoted, `$@` would have split it in two.

## Local variables and scope

By default every variable is **global**: a function that sets `count` changes the `count` the rest of the script sees. `local name` (or `local name=value`) creates a variable that exists only until the function returns, hiding any outer variable of the same name meanwhile.

Bash uses **dynamic scoping**: a local variable is visible to the function that declared it *and to every function it calls*. What a name refers to depends on who called whom at run time, not on where the code is written.

```bash
count=10
show() { echo "show sees count=$count"; }
bump_local() {
  local count=1
  count=$((count + 1))
  show
}
bump_global() {
  count=$((count + 1))
}
bump_local
echo "after bump_local: count=$count"
bump_global
echo "after bump_global: count=$count"
```

```text
show sees count=2
after bump_local: count=10
after bump_global: count=11
```

`show` printed 2, the local of the function that called it. Make every variable inside a function `local` unless changing a global is the point. Loop variables count too: the `local arg` in `greet` stops the loop from overwriting an `arg` that belongs to the caller.

## Status versus output

A function sends results back in two separate channels, and good functions keep them apart.

- **The return status** is a number from 0 to 255. `return n` ends the function with status `n`. Without `return`, the status is that of the last command run. Zero means success, so a function used in `if` or `&&` should answer a yes or no question through its status.
- **The output** is whatever the function prints. Capture it with **command substitution**, `var=$(function args)`, which runs the function and stores its standard output with trailing newlines removed. Use this for data: a name, a path, a number bigger than 255.

```bash
is_port() {
  [[ $1 =~ ^[0-9]+$ ]] && (( $1 >= 1 && $1 <= 65535 ))
}
slugify() {
  local text=$1
  printf '%s\n' "$text" | tr '[:upper:] ' '[:lower:]-'
}

for p in 22 http 70000; do
  if is_port "$p"; then
    echo "$p is a port"
  else
    echo "$p is not a port (status $?)"
  fi
done

name=$(slugify "Quarterly Report")
echo "file name: $name.txt"

too_big() { return 300; }
too_big
echo "return 300 gives status $?"
```

```text
22 is a port
http is not a port (status 1)
70000 is not a port (status 1)
file name: quarterly-report.txt
return 300 gives status 44
```

`is_port` needs no `return`: the status of its last command is the answer. The last line shows why a status is not a way to return data: only the low 8 bits survive, so 300 became 44. Messages for humans, such as warnings, belong on standard error (`>&2`), so they are never captured by mistake along with the data.

## A library of functions

Once several scripts need the same helpers, move them into a file and load it with `source file` (the short form is `. file`). Sourcing runs the file *in the current shell*, so its functions and variables become part of your script; running it with `bash file` would define them in a child process that then exits.

```bash
# tool/lib/log.sh: logging helpers. Source this file; do not run it.
log() { printf '[%s] %s\n' "$1" "$2" >&2; }
die() { log error "$1"; exit "${2:-1}"; }
```

```bash
#!/usr/bin/env bash
# tool/check.sh
here=$(dirname -- "${BASH_SOURCE[0]}")
source "$here/lib/log.sh"

main() {
  log info "checking $# file(s)"
  local file
  for file in "$@"; do
    [[ -r $file ]] || die "cannot read $file" 3
    log info "$file is readable"
  done
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
```

Running `bash tool/check.sh notes.txt missing.txt; echo "status $?"`:

```text
[info] checking 2 file(s)
[info] notes.txt is readable
[error] cannot read missing.txt
status 3
```

Three habits are at work. `BASH_SOURCE[0]` is the path of the file being executed, so `$here` finds the library relative to the script wherever it is run from; a plain `source lib/log.sh` would look in the current directory. All the work lives in `main`, called with `"$@"` so it receives the script's arguments. And the final `if` runs `main` only when the file is executed: when another script sources `check.sh` to reuse its functions, `BASH_SOURCE[0]` and `$0` differ and nothing runs.

## Common mistakes

- **Calling `die` inside `$( )`.** Command substitution runs in a **subshell**, a copy of the shell, so `exit` there ends only the copy. `value=$(die "no config")` prints the message and the script carries on with an empty `value`.
- **Forgetting `local`.** A helper with a loop over `i` silently changes the caller's `i`.
- **Returning data through the status.** It is limited to 0 to 255. Print data and capture it instead.
- **Printing messages on standard output.** They end up inside the captured value. Send them to standard error.
- **Calling a function before its definition has run.**

## Practice

1. Write `max` that prints the larger of its two numeric arguments, and use it as `biggest=$(max 7 12)`.
2. Write `has_command NAME` that succeeds when `NAME` can be run, for use as `if has_command jq; then`.
3. What does this print, and why?

   ```bash
   x=1
   outer() { local x=2; inner; }
   inner() { echo "x=$x"; }
   outer; inner
   ```

### Answers

1. Data travels as output:

   ```bash
   max() {
     if (( $1 > $2 )); then echo "$1"; else echo "$2"; fi
   }
   biggest=$(max 7 12)   # 12
   ```

2. The status of the last command is the answer, and the output is thrown away because the caller only wants yes or no:

   ```bash
   has_command() { command -v -- "$1" >/dev/null 2>&1; }
   ```

3. `x=2`, then `x=1`. The first `inner` is called from `outer`, so dynamic scoping shows it `outer`'s local. The second call comes from the top level, where only the global exists.

## Key takeaways

- Define a function as `name() { ...; }` before calling it. It runs in the current shell.
- Its arguments are `$1`, `$#` and `"$@"`; the script's own come back afterwards.
- Make its variables `local`. Locals are visible to the functions it calls (dynamic scoping).
- Status (0 to 255) answers yes or no; output, captured with `$( )`, carries data.
- Share helpers with `source`, find them through `BASH_SOURCE`, and guard `main` with `[[ ${BASH_SOURCE[0]} == "$0" ]]`.

## Further reading

- [GNU Bash manual: Shell Functions](https://www.gnu.org/software/bash/manual/html_node/Shell-Functions.html)
- [Bash Reference Manual (Chet Ramey's copy): Bourne Shell Builtins, including `return` and `source`](https://tiswww.case.edu/php/chet/bash/bashref.html#Bourne-Shell-Builtins)
- [Greg's Wiki: Bash Pitfalls](https://mywiki.wooledge.org/BashPitfalls)
