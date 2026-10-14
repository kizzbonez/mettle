Write the four functions of `solution.py`. The tests call them with names in many scripts and
spellings, including letters written as a base letter plus a combining accent.

1. `name_key(name)` returns the form of a name used to tell whether two entries are the same
   singer: normalize it to NFC with `unicodedata.normalize`, **casefold** it, then join its
   words with single spaces, so whitespace at the ends disappears and any run of spaces, tabs
   or newlines inside becomes one space.
2. `fit_bytes(text, limit)` returns the longest start of `text` whose UTF-8 encoding is at most
   `limit` bytes. It never cuts a character in half: a character whose bytes do not all fit is
   left out, with everything after it.
3. `code_points(text)` returns each character of `text` as `U+` followed by its code point in
   upper-case hexadecimal, at least four digits, separated by single spaces. An empty text
   gives `""`.
4. `badge_line(seat, name, fee)` returns one line of the seating list: the seat number padded
   with zeros to three digits, a space, the name left-aligned in 20 characters, a space, and the
   fee right-aligned in 9 characters with a comma between thousands and two decimals. Wider
   values are never cut, they just take more room.

Example:

```python
name_key("  Zoë   MÜLLER ")             # 'zoë müller'
name_key("Straße")                      # 'strasse'
fit_bytes("Zoë Müller", 3)              # 'Zo'   (ë takes two bytes, so it does not fit)
fit_bytes("Zoë Müller", 4)              # 'Zoë'
code_points("Zoë")                      # 'U+005A U+006F U+00EB'
code_points("🎵")                       # 'U+1F3B5'
badge_line(7, "Zoë Müller", 1250.5)     # '007 Zoë Müller            1,250.50'
```

**Tips.** `lower` is not enough for `ß`. For `fit_bytes`, encode, slice the `bytes`, and decode
with an error handler that drops the incomplete character at the end. The format specification
`04X` pads a number to four upper-case hex digits.
