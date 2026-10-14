Write `solution.sh`. It is run as `bash solution.sh FILE`, and the starter already stores the
file name in the variable `file`. The name may contain spaces.

1. A **ticket ID** is two to four capital letters (`A` to `Z`), a hyphen, then three to five
   digits. It must stand on its own: the character just before it and the character just after
   it, where there is one, is not a letter, a digit or an underscore.
   - `NET-1043`, `DB-310`, `(HR-0042)` and `OPS-7781.` contain IDs.
   - `ACCTS-55120` (five letters), `NET-12` (two digits), `NET-123456` (six digits),
     `net-1043`, `xNET-1043` and `NET-1043_old` do not contain any.
2. Print every ticket ID found anywhere in `FILE`, each one **once**, in the order `sort` gives.
   A line may contain several IDs.
3. Then print one more line, `lines without a ticket: N`, where `N` is the number of lines of
   `FILE` that contain no ticket ID. Every line counts, including empty lines and a last line
   with no newline after it.

For the sample file (`bash solution.sh data/standup.txt`) the output is:

```text
DB-310
HR-0042
NET-1043
OPS-7781
lines without a ticket: 3
```

The three lines without a ticket are `nothing to report`, `lunch order sorted`, and the line
with `NET-12` and `ACCTS-55120`, neither of which is an ID.

**Tips.**
- Write the pattern once in a variable, `id='...'`, and use `"$id"` in both `grep` commands.
- Which `grep` option prints only the matched text, and which one insists on whole words?
- Try your pattern on single lines first: `echo 'see (HR-0042).' | grep ...`.
