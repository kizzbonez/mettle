A test cannot type a command or read a file, so the whole tool is written the way the lesson
recommends: as functions that take values and return values. `run` receives the arguments and
the text of the file, and returns an `Outcome`: what the program would write to standard
output, what it would write to standard error, and its exit code. A real `main` would only
print the two texts and return the code. The two structs are in the starter.

1. `Config::build(args: &[&str]) -> Result<Config, String>` checks the arguments. Like the
   real command line, `args[0]` is the name of the program and is skipped.
   - `args[1]` is the tag, written without the `#`. If it is missing, the error is
     `no tag given`.
   - `args[2]` is the limit, the largest number of tasks to print. If it is missing, the
     limit is `3`. If it does not parse as a `usize`, or is `0`, the error is the argument
     between backticks followed by ` is not a limit`, for example `` `many` is not a limit ``.
   - Any further arguments are ignored.
2. `tagged<'a>(text: &'a str, tag: &str, limit: usize) -> Vec<(usize, &'a str)>` is the logic.
   Every line of `text` is a task. A task carries the tag when one of its words, split at
   whitespace, is exactly `#` followed by the tag. Return the first `limit` such tasks in
   order, each as its line number and the line. Line numbers start at 1 and count every line.
3. `run(args: &[&str], text: &str) -> Outcome` connects the two.
   - If `Config::build` fails: nothing on standard output. Standard error gets two lines,
     `error: ` with the message and then `usage: tasks <tag> [limit]`. The exit code is `2`.
   - If no task carries the tag: nothing on standard output. Standard error gets one line,
     `error: no task is tagged #` with the tag. The exit code is `1`.
   - Otherwise standard output gets one line for each task: the line number right-aligned in
     a width of 3, a space, and the task. Standard error is empty and the exit code is `0`.
   - Every line that is written ends with `\n`.

Example:

```rust
let text = "buy milk #shop\ncall Bo #phone\nbuy stamps #shop #post\nwater plants\nreturn shoes #shop";

Config::build(&["tasks", "shop", "2"])   // Ok(Config { tag: "shop", limit: 2 })
tagged(text, "shop", 2)                  // [(1, "buy milk #shop"), (3, "buy stamps #shop #post")]

run(&["tasks", "shop", "2"], text)
// stdout: "  1 buy milk #shop\n  3 buy stamps #shop #post\n"    stderr: ""    code: 0

run(&["tasks", "garden"], text)
// stdout: ""    stderr: "error: no task is tagged #garden\n"    code: 1

run(&["tasks"], text)
// stdout: ""    stderr: "error: no tag given\nusage: tasks <tag> [limit]\n"    code: 2
```
