The starter has three functions. Treat each one as a small program of its own, like `main` in
the lesson: you write `println!` and `print!` statements between its braces. The tests call the
functions and read what they print, so every character counts, including capital letters,
spaces and punctuation.

1. `welcome` still prints the lesson's `Hello, world!`. Change the text so that it prints this
   line:

   ```text
   Welcome to the Roxy!
   ```

2. `showings` prints nothing yet. Make it print these two lines, in this order:

   ```text
   Screen 1: The Long Voyage
   Screen 2: Night Train
   ```

3. `seat_label` prints nothing yet. Make it print `Your seat: ` with one space after the colon,
   and **do not end the line**. Whatever is printed next has to land on the same line.

Do not rename the functions, and leave the word `pub` in front of each `fn`. It is what lets
the tests reach them.

Example: the visible test calls `welcome`, `showings` and `seat_label`, and then prints the
seat number `F7` itself. Together that must give:

```text
Welcome to the Roxy!
Screen 1: The Long Voyage
Screen 2: Night Train
Your seat: F7
```

**Tip:** if **Run** reports a compiler error, read it as in the lesson. A missing `;` and a
missing `!` are the two most likely causes, and the `help` line names the fix.
