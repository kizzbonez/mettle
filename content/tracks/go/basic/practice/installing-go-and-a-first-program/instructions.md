In this lab you finish a small program and fix two lines that lesson 2 warned you about: one that
the compiler rejects and one that `go vet` reports. The lab builds your file the way `go test`
does, which runs the compiler and the most important `go vet` checks. When either finds a
problem, **Run** stops and shows you the message instead of running the program.

1. Press **Run** once as the file is. It compiles and runs, and the visible test shows that the
   banner is not complete yet.
2. **Part 1.** At the comment `YOUR CODE, part 1`, add two `fmt.Println` lines that print the
   planetarium's name and tonight's show, each starting with two spaces, as in the banner below.
3. **Part 2.** Remove the `//` from the start of the line `fmt.println("Doors open at 19:30")` and
   press **Run**. Read the error by its parts: the file, the line, the column and the message.
   Then fix the line.
4. Remove the `//` from the line with `"Show starts at %s"` and press **Run**. This time the
   compiler is happy but `go vet` is not. Fix the line so that `Println` prints `Show starts at
   20:00`: it puts a space between its values by itself.
5. Press **Run** until the visible test passes, then **Submit**.

The banner your program should print:

```text
==============================
  Starfield Planetarium
  Tonight: The Northern Sky
==============================
Doors open at 19:30
Show starts at 20:00
Please switch off your phone
```

Each border is 30 `=` signs; keep the two that are already there. On your own computer you would
run the same program with `go run .` and check it with `go vet .`.
