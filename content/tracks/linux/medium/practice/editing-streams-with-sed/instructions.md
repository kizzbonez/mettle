Write `solution.sh`. It is run as `bash solution.sh FILE`, and the starter already stores the
file name in the variable `file`. The name may contain spaces. Each line of `FILE` is a comment,
an empty line or a setting `name=value`; the **name** is the text before the first `=`.

1. On every line whose name **ends in** `url`, such as `url` or `fallback_url`, replace **every**
   `http://` with `https://`. On all other lines, `http://` stays as it is.
2. On every line whose name is exactly `expires`, rewrite the date from `DD/MM/YYYY` (two digits,
   two digits, four digits) to `YYYY-MM-DD`. Dates on other lines stay as they are.
3. Delete the comment lines, whose first character is `#`, and the empty lines. A `#` later in a
   line does not make it a comment.
4. Change `FILE` itself, in place, and keep the original, unchanged, next to it as `FILE.bak`.
   Print nothing.

For the sample file (`cp data/lobby.conf lobby.conf`, then `bash solution.sh lobby.conf`),
`lobby.conf` becomes:

```text
name=Lobby screen #1
url=https://cdn.example.org/lobby/playlist.json
fallback_url=https://cdn.example.org/static/fallback.png
expires=2026-12-31
renewed=03/02/2026
volume=40
note=old manual at http://wiki.example.org/players
```

and `lobby.conf.bak` holds the original text.

**Tips.**
- Work on a copy and leave out `-i` until the output is right; then add `-i.bak`.
- An address in front of `s` limits it to the lines you mean. What regex says "the text before
  the first `=` ends in `url`"?
- Paths are full of slashes: choose another delimiter for `s`.
