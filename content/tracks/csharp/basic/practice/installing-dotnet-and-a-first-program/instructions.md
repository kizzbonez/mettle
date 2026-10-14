The starter has a class named `FerryBoard` with three methods. Treat each method as a small
program of its own, like the lesson's `hello.cs`: you write `Console.WriteLine` and
`Console.Write` statements between its braces. The class around them is the same kind of
wrapper as `class Program` in the lesson's `Main` example, without a `Main`, because here the
tests are the program: they call your methods and read what they print. Every character counts,
including capital letters, spaces and punctuation.

1. `Welcome` still prints the lesson's `Hello, World!`. Change the text so that it prints this
   line:

   ```text
   Welcome to Harbour Quay!
   ```

2. `Sailings` must print these two lines, in this order:

   ```text
   07:45 Gull Island
   09:30 Little Skerry
   ```

   It already prints a note for the staff, which passengers must not see. Turn that line into a
   comment, so that it stays in the file but is no longer printed.
3. `GateLabel` prints nothing yet. Make it print `Board at gate ` with one space at the end, and
   **do not end the line**: whatever is printed next has to land on the same line.

Do not rename the methods, and leave `public static` in front of each one. Those words let the
tests call them, and lesson 8 explains them.

Example: the visible test calls `Welcome`, `Sailings` and `GateLabel`, and then prints the gate
number `4` itself. Together that must give:

```text
Welcome to Harbour Quay!
07:45 Gull Island
09:30 Little Skerry
Board at gate 4
```

**Tip:** if **Run** reports a compiler error, read it as in the lesson. A missing `;` gives
CS1002, and a name written with the wrong capitals, such as `Writeline`, gives CS0117.
