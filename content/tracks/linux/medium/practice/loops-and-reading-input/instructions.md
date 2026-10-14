Write `solution.sh`. It is run as `bash solution.sh FILE`, and the starter already stores the
file name in the variable `file`. The name may contain spaces. Use a `while read` loop.

1. Each line of `FILE` is `item,stock,minimum`: an item name, then two whole numbers. Item names
   may contain spaces and backslashes, and spaces at their start; print them exactly as written.
2. Read **every** line, including a last line that has no newline after it.
3. Skip empty lines and lines whose first character is `#`.
4. A line that is just `END` ends the list: ignore it and every line after it.
5. For each item whose stock is **lower** than its minimum, print `buy ITEM: N`, where
   `N = 2 × minimum − stock`, in the order of the file.
6. After the loop, print `total: T`, where `T` is the sum of all the `N` (`0` when nothing needs
   buying).

For the sample file (`bash solution.sh data/pantry.csv`) the output is:

```text
buy rice: 6
buy olive oil: 3
buy salt: 2
total: 11
```

`flour` has more than its minimum, and `sugar` comes after `END`.

**Tips.**
- `while IFS=, read -r item stock minimum || [ -n "$item" ]; do ... done < "$file"` splits each
  line at the commas and still reads a last line without a newline.
- `continue` skips to the next line and `break` leaves the loop.
- Feed the file to the loop with `< "$file"` after `done`. Piping `cat` into `while` runs the loop
  in a subshell, and the total is lost when it ends.
