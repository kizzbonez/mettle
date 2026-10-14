Complete `solution.sh`. It is run as `bash solution.sh CONFIG HOST`, where `CONFIG` is an
`~/.ssh/config` file and `HOST` the name typed after `ssh`. It prints where ssh would connect:

```text
hostname VALUE
user VALUE
port VALUE
proxyjump VALUE
```

1. **Lines.** Ignore blanks at the start of a line, and skip empty lines and comments (first
   non-blank character `#`). A line is a keyword and a value, separated by blanks **or by `=`**
   with optional blanks around it (`Port 2222`, `Port=2222` and `Port = 2222` are the same).
   Keywords are **case-insensitive**. For `HostName`, `User`, `Port` and `ProxyJump` the value is
   one word.
2. **Blocks.** `Host PATTERN...` starts a block, which applies when `HOST` matches **any** of its
   patterns, unless it matches a pattern written with a leading `!` (`!bastion`): then the block
   does not apply. In a pattern `*` matches any characters and `?` exactly one. Lines before the
   first `Host` apply to every host.
3. **First value wins.** Go through the file in order; for each keyword, the first value found in
   a block that applies is the one used. Later values are ignored.
4. **Results.** In the host name, `%h` stands for `HOST`. A keyword never set gives its default:
   the host name is `HOST`, the port is `22`, and user and proxyjump are `none`.

Example: `bash solution.sh data/ssh_config web01` prints

```text
hostname web01.corp.example.com
user deploy
port 2222
proxyjump bastion
```

`web01` matches `web??`, `web01` and `*`. `User deploy` comes before `User ana` in `Host *`.

**Tips:** in `[[ $host == $pattern ]]` an unquoted pattern is matched as a glob, with `*` and `?`
as above. Split a list of patterns with `read -ra patterns <<< "$value"`: an unquoted
`for p in $value` would let the shell expand `*` into the names of files.
`${keyword,,}` is the keyword in lower case.
