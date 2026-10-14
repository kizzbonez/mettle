Write `solution.sh`. It is run as `bash solution.sh FILE TAG`: `FILE` is the name of a file in
the current directory and `TAG` a short label such as `v2` or `before legal`. Either may contain
spaces.

1. Store the two arguments in the variables `file` and `tag`.
2. Copy `FILE` to a new file named `TAG`, an underscore, then `FILE`: for `story.txt` and `v2`,
   the copy is `v2_story.txt`.
3. Print one line: `saved COPY: L lines, W words`, where `COPY` is the copy's name and `L` and `W`
   are the numbers of lines and words in `FILE`, as `wc -l` and `wc -w` count them.
4. The script's exit status must be the exit status of `cp`: `0` when the copy worked, and `cp`'s
   own non-zero status when it failed, even though the script runs more commands after `cp`.
   When the copy fails, what the script prints does not matter.

For the sample story (`cp data/story.txt story.txt`, then `bash solution.sh story.txt v2`), the
script creates `v2_story.txt`, prints

```text
saved v2_story.txt: 5 lines, 33 words
```

and exits with status `0`. `bash solution.sh missing.txt v2` exits with status `1`, the status
`cp` returns when its source does not exist.

**Tips.**
- `"$tag_$file"` does not do what it seems to: Bash reads a variable called `tag_`. Braces
  mark where the name ends.
- `wc -l < FILE` prints the number alone; `wc -l FILE` adds the file name.
- `$?` changes after every command, so save it in a variable straight after `cp`.
