The script reads one line, `entered`: a first name and a last name, typed in any mix of capitals,
with any number of spaces or tabs around and between them. There are always exactly two names,
and neither contains a space, a hyphen or an apostrophe. The tests run your file as a script and
type the line into it. Fill in the names in the `YOUR CODE` blocks; the `print` lines are
already written.

1. `first` and `last`: the two names, each with a capital first letter and the rest in lower
   case, as `title()` gives them.
2. `full_name`: the first name, one space, the last name.
3. `sorted_as`: the last name in capitals, a comma, one space, then the first name.
4. `initials`: the first letter of each name, each followed by a dot.
5. `badge`: the full name centred in a space 20 characters wide, between two `|` bars. When the
   spaces cannot be shared equally, the extra one goes on the right, which is what `^20` in an
   f-string does. A name longer than 20 characters is printed in full, with nothing added.

Example: when the tests type `  ada   LOVELACE `, the script prints:

```text
Ada Lovelace
LOVELACE, Ada
A.L.
|    Ada Lovelace    |
```

**Tips.** Remember that a method returns a new string and leaves the original alone. `split()`
with no argument splits on runs of spaces and tabs and ignores them at both ends, and
`first, last = ...` binds two names to the two parts, as in the lesson's practice answer 2.
`first[0]` is the first letter. Letters with accents, such as `é` or `Å`, work like any other.
