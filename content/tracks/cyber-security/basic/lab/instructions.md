Write `solution.sh`. It receives the path of a log file as its first argument.

1. Consider only lines that contain `Failed password`. This includes failures for accounts that
   do not exist (`Failed password for invalid user …`).
2. For each such line, take the source address: the field that follows the word `from`.
3. Count the failures per address.
4. Keep only addresses with **3 or more** failures.
5. Print one line per address in the form `<address> <count>`, separated by a single space.
6. Order the lines by count, highest first. When two addresses have the same count, order them
   by address as plain text, ascending. That is what `sort` does by default, so `172.16.0.10`
   comes before `172.16.0.9`.
7. If no address reaches the threshold, print nothing and exit with status `0`.

Example, for `data/auth.log`:

```text
203.0.113.7 5
198.51.100.23 3
```

**Tools available:** `bash`, `grep`, `sed`, `awk`, `sort`, `uniq`, `cut`, `tr`, `jq`.

**Tip:** `Accepted password` lines also contain the word `from`. Filter before you extract.
