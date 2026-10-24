---
title: Reading Input and Putting It Together
summary: Read command-line arguments with os.Args and the flag package, read standard input line by line with bufio.Scanner, report bad lines with their numbers on standard error, set exit codes, and build a complete command-line program from small functions.
minutes: 40
objectives:
  - Read command-line arguments with os.Args and define flags with flag.Int and flag.Parse
  - Read standard input line by line with bufio.Scanner and check its error
  - Report bad input lines with their line numbers on standard error and exit with the right code
  - Structure a program as small, testable functions and a main that wires them together
---

## Outline

1. Command-line arguments
2. Flags
3. Reading standard input line by line
4. A complete program, step by step
5. Exit codes and other ways to read

## Command-line arguments

Every program so far has used values written into its code. Real tools take their input from
outside: words typed after the program's name, and text sent to its **standard input**. Words
after the name are **command-line arguments**, and `os.Args` holds them as a `[]string`:

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println(len(os.Args), os.Args[0])
	for i, arg := range os.Args[1:] {
		fmt.Printf("argument %d: %q\n", i+1, arg)
	}
}
```

```sh
$ go build -o greet . && ./greet Ada 'Bo Lee' -v
4 ./greet
argument 1: "Ada"
argument 2: "Bo Lee"
argument 3: "-v"
```

`os.Args[0]` is the program itself; the arguments start at index 1. The shell splits the line at
spaces, so quotes keep `Bo Lee` together. `-v` is just another string: nothing has interpreted it.

## Flags

Options such as `-places 3` are **flags**. Parsing them by hand is tedious, so the standard `flag`
package does it. `flag.Int(name, default, usage)` defines an integer flag and returns a pointer
(lesson 13) to its value; `flag.Bool` and `flag.String` work the same way. `flag.Parse()` reads
`os.Args`, and `flag.Args()` returns the arguments left after the flags. Built as `conv`:

```go
package main

import (
	"flag"
	"fmt"
)

func main() {
	places := flag.Int("places", 2, "decimal places to print")
	loud := flag.Bool("loud", false, "print in capitals")
	flag.Parse()
	fmt.Println(*places, *loud, flag.Args())
}
```

```sh
$ ./conv -places 3 -loud a.txt b.txt
3 true [a.txt b.txt]
$ ./conv a.txt -places 1
2 false [a.txt -places 1]
$ ./conv -places=x
invalid value "x" for flag -places: parse error
Usage of ./conv:
  -loud
    	print in capitals
  -places int
    	decimal places to print (default 2)
$ echo $?
2
```

Flags come before the other arguments: parsing stops at the first argument that is not a flag.
`-places 3`, `-places=3` and `--places 3` are all accepted. A bad value or an unknown flag prints
the error and a usage message generated from your descriptions, then exits with code 2; `-h`
prints the usage. That is all a small tool needs; Professional 05 covers configuration properly.

## Reading standard input line by line

`bufio.NewScanner(os.Stdin)` makes a **scanner** that reads its input piece by piece; by default
each piece, called a **token**, is one line. `Scan()` reads the next line and returns `false` at
the end of the input. `Text()` returns the line without its line ending. After the loop, `Err()`
reports what went wrong if reading failed, and returns `nil` at a normal end of input.

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := scanner.Text()
		fmt.Printf("%d: %q has %d words\n", lineNo, line, len(strings.Fields(line)))
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "reading input:", err)
		os.Exit(1)
	}
}
```

Given `"the quick brown fox\r\n\n  jumps over  \nthe lazy dog"`:

```text
1: "the quick brown fox" has 4 words
2: "" has 0 words
3: "  jumps over  " has 2 words
4: "the lazy dog" has 3 words
```

A few details matter. Counting lines yourself gives you line numbers for error messages. The
Windows `\r` before the newline is removed too, and a last line without a newline is still read.
`strings.Fields` (lesson 05) splits a line into words at any run of spaces, which makes it the
easy way to read lines of several values. A scanner refuses a line longer than 64 KiB, and
`Err()` then reports `bufio.Scanner: token too long`; ordinary text never comes close.

## A complete program, step by step

Now put it together: a tool that reads distances in kilometres, one per line, and prints them in
miles. Build it as small functions that each do one job, and a `main` that only wires them up:

1. `parseKm` turns one line into a number or an error, using lesson 14's style.
2. `convert` turns a number into an output line. Neither function knows about standard input,
   so either can be tested on its own.
3. `main` reads the flag, loops over the lines, sends results to standard output and problems to
   standard error, and chooses the exit code.

```go
package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const milesPerKm = 0.621371

// parseKm reads one distance in kilometres, which must not be negative.
func parseKm(text string) (float64, error) {
	km, err := strconv.ParseFloat(text, 64)
	if err != nil {
		return 0, fmt.Errorf("distance %q: %w", text, err)
	}
	if km < 0 {
		return 0, fmt.Errorf("distance %v km is negative", km)
	}
	return km, nil
}

// convert returns one line of output, with places decimals for the miles.
func convert(km float64, places int) string {
	miles := strconv.FormatFloat(km*milesPerKm, 'f', places, 64)
	return strconv.FormatFloat(km, 'f', -1, 64) + " km = " + miles + " mi"
}

func main() {
	places := flag.Int("places", 2, "decimal places for the miles, 0 to 6")
	flag.Parse()
	if *places < 0 || *places > 6 {
		fmt.Fprintln(os.Stderr, "km: -places must be from 0 to 6")
		os.Exit(2)
	}

	scanner := bufio.NewScanner(os.Stdin)
	lineNo, bad := 0, 0
	for scanner.Scan() {
		lineNo++
		text := strings.TrimSpace(scanner.Text())
		if text == "" {
			continue
		}
		km, err := parseKm(text)
		if err != nil {
			fmt.Fprintf(os.Stderr, "line %d: %v\n", lineNo, err)
			bad++
			continue
		}
		fmt.Println(convert(km, *places))
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "km: reading input:", err)
		os.Exit(1)
	}
	if bad > 0 {
		os.Exit(1)
	}
}
```

```sh
$ printf '5\n42.195\n\nten\n-3\n 0.5 \n' | ./km
5 km = 3.11 mi
42.195 km = 26.22 mi
line 4: distance "ten": strconv.ParseFloat: parsing "ten": invalid syntax
line 5: distance -3 km is negative
0.5 km = 0.31 mi
$ echo $?
1
```

A bad line does not stop the program: it is reported with its number, and the good lines are
still converted. The blank line is skipped but still counted, so the numbers match what the user
sees in an editor. Because problems go to standard error, `./km < in.txt > out.txt` writes only
clean results to the file while the problems still appear on the screen.

## Exit codes and other ways to read

The **exit code** is how a program tells a shell script or a test whether it worked. `0` means
success and is what `main` gives when it simply returns; `1` is the usual code for "something
failed", and `2` for "the command was used wrongly", as the `flag` package does. Use `os.Exit`
only in `main`, after the messages are printed: it ends the program at once.

To read a single answer, `bufio.NewReader(os.Stdin)` and `ReadString('\n')` read up to and
including the next newline. The result keeps the `"\n"`, so trim it; the error is `io.EOF` when
the input ends without one. For many lines, the scanner is simpler.

## Common mistakes

- **Reading `os.Args[1]` without checking `len(os.Args)`.** With no arguments the program panics:
  `index out of range [1] with length 1`. Check the length first.
- **Forgetting `flag.Parse()`.** Every flag keeps its default value, whatever the user typed.
- **Not checking `scanner.Err()`.** A failed read looks exactly like the end of the input.
- **Errors on standard output.** They end up mixed with the results in redirected output. Use
  `fmt.Fprintln(os.Stderr, ...)`.
- **Stopping at the first bad line,** or reporting it without its line number. Report each one
  with its number, and carry on.

## Practice

1. For `./sum -min 5 a b`, what do `os.Args[1:]` and `flag.Args()` hold?
2. Write `sum`: it reads whole numbers, one per line, and prints their total. Report each bad line
   as `line N: <error>` on standard error, and exit with code 1 if there was any.
3. Add a flag `-min` (default 0): numbers below it are not added.

### Answers

```go
package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	minimum := flag.Int("min", 0, "ignore numbers below this")
	flag.Parse()
	fmt.Println(os.Args[1:], flag.Args())

	scanner := bufio.NewScanner(os.Stdin)
	sum, lineNo, failed := 0, 0, false
	for scanner.Scan() {
		lineNo++
		n, err := strconv.Atoi(strings.TrimSpace(scanner.Text()))
		if err != nil {
			fmt.Fprintf(os.Stderr, "line %d: %v\n", lineNo, err)
			failed = true
			continue
		}
		if n >= *minimum {
			sum += n
		}
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "sum: reading input:", err)
		os.Exit(1)
	}
	fmt.Println("sum:", sum)
	if failed {
		os.Exit(1)
	}
}
```

```sh
$ printf '4\n10\nsix\n7\n' | ./sum -min 5 a b
[-min 5 a b] [a b]
line 3: strconv.Atoi: parsing "six": invalid syntax
sum: 17
$ echo $?
1
```

`os.Args[1:]` holds everything typed; `flag.Args()` only what is left after the flags.

## Key takeaways

- `os.Args[0]` is the program; arguments start at index 1. The `flag` package parses options.
- `bufio.Scanner`: loop on `Scan()`, read `Text()`, then check `Err()`.
- Count lines yourself to report bad ones as `line N: ...`, and keep going.
- Results to standard output, problems to standard error.
- Exit code 0 for success, 1 for failure, 2 for wrong usage; `os.Exit` only in `main`.
- Small functions do the work; `main` wires them to the input and output.

## Further reading

- [Package bufio: Scanner](https://pkg.go.dev/bufio#Scanner)
- [Package flag](https://pkg.go.dev/flag)
- [Package os: Args and Exit](https://pkg.go.dev/os#pkg-variables)
- [Go by Example: Line Filters](https://gobyexample.com/line-filters)
