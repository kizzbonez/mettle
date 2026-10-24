---
title: Making Decisions with if and switch
summary: Choose what a program does with if, else if and else, an if with a short statement and string comparisons, and with switch on a value, with several values per case, with no condition and with a short statement, plus default and the rare fallthrough.
minutes: 35
objectives:
  - Write if, else if and else chains, and read the errors for a missing brace, a misplaced else and a non-boolean condition
  - Use an if or a switch with a short statement and say where its variable can be used
  - Write a switch on a value with several values per case and a default, and explain why Go does not fall through
  - Replace an if-else chain with a switch that has no condition, putting the cases in the right order
---

## Outline

1. if, else if and else
2. Braces, conditions and the else line
3. An if with a short statement
4. Comparing strings
5. switch on a value
6. No fall-through, and the fallthrough keyword
7. switch with no condition
8. switch with a short statement

## if, else if and else

Until now every line of a program ran, from top to bottom. An **if statement** runs a block of
code only when a **condition** is true. The condition is any expression of type `bool`, such as
the comparisons from lesson 04:

```go
package main

import "fmt"

func main() {
	wind := 27
	if wind < 20 {
		fmt.Println("all sailings run")
	} else if wind < 35 {
		fmt.Println("short crossings only")
	} else {
		fmt.Println("harbour closed")
	}
	fmt.Println("checked at", wind, "km/h")
}
```

```text
short crossings only
checked at 27 km/h
```

Go tests the conditions from the top and runs the first block whose condition is true. The final
`else` catches every case left over. Exactly one of the three blocks runs, then the program
carries on after the whole statement.

## Braces, conditions and the else line

Go's if looks like C's, but it is stricter:

- There are no parentheses around the condition. `if (wind < 20) {` compiles, but gofmt removes
  the parentheses.
- The braces are required, even around a single line, and `{` must be on the same line as the
  condition. Go ends a statement at the end of a line that could end one, so a brace on the next
  line is too late:

  ```text
  ./main.go:7:14: syntax error: unexpected newline, expected { after if clause
  ```

- `else` goes on the same line as the closing brace, `} else {`. On a line of its own, the if
  has already ended:

  ```text
  ./main.go:10:2: syntax error: unexpected keyword else, expected }
  ```

- The condition must be a `bool`. Go never treats a number or a string as true or false, so
  `if tickets {` with an `int` is `./main.go:7:5: non-boolean condition in if statement`. Write
  `if tickets > 0 {`.

## An if with a short statement

An if may begin with a **short statement**, usually a `:=` declaration, then a semicolon, then
the condition:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	name := "Isle of Mull Explorer"
	if n := len(name); n > 16 {
		fmt.Println("too long for the ticket:", n, "bytes")
	} else {
		fmt.Println("fits:", n, "bytes")
	}

	if before, _, found := strings.Cut(name, " of "); found {
		fmt.Println("short name:", before)
	}
}
```

```text
too long for the ticket: 21 bytes
short name: Isle
```

The variable belongs to the if: its **scope** is the condition and every block of the statement,
`else` included, and it is gone afterwards. `fmt.Println(n)` after the if is
`./main.go:10:14: undefined: n`. That is the point: a value needed only for one decision does
not linger in the rest of the function. The second if keeps all three results of `strings.Cut`
(lesson 05) inside the if. You will write `if err := ...; err != nil` often from lesson 14 on.

## Comparing strings

`==` and `!=` compare strings byte by byte, so they are case-sensitive. `<` and `>` compare in
byte order, which is alphabetical only for letters of the same case:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	fmt.Println("apple" < "banana", "Zebra" < "apple", "10" < "9")
	answer := "Yes"
	fmt.Println(answer == "yes", strings.EqualFold(answer, "yes"))
}
```

```text
true true true
false true
```

`"Zebra"` sorts first because `Z` is byte 90 and `a` is 97, and `"10" < "9"` because `1` comes
before `9`. To ignore case, use `strings.EqualFold`. To compare numbers typed as text, convert
them with `strconv.Atoi` first.

## switch on a value

When one value is compared with many options, a **switch** is clearer than a chain of
`else if day == ...`:

```go
package main

import "fmt"

func main() {
	day := "sat"
	switch day {
	case "sat", "sun":
		fmt.Println("weekend timetable")
	case "mon", "tue", "wed", "thu", "fri":
		fmt.Println("weekday timetable")
	default:
		fmt.Println("unknown day:", day)
	}
}
```

```text
weekend timetable
```

Go works out `day` once and compares it with the cases from top to bottom; the first match runs.
A **case** may list several values, separated by commas. The **default** case runs when nothing
matches; it may stand anywhere, but put it last. The same constant in two cases is an error:
`duplicate case "sat" (constant of type string) in expression switch`.

## No fall-through, and the fallthrough keyword

In C, Java and JavaScript, a case runs on into the next one unless it ends with `break`, and a
forgotten `break` is a classic bug. In Go a case ends where the next one starts. When you really
want to continue, `fallthrough` as the last statement of a case runs the next case's block,
**without** testing its value:

```go
package main

import "fmt"

func main() {
	level := 2
	switch level {
	case 3:
		fmt.Println("check the engine")
		fallthrough
	case 2:
		fmt.Println("check the life jackets")
		fallthrough
	case 1:
		fmt.Println("check the lights")
	}
}
```

```text
check the life jackets
check the lights
```

Level 2 runs its own checks and those of level 1. `fallthrough` is rare in real Go: the flow is
easy to misread, and separate if statements usually say the same thing more plainly. It cannot
be the last case's statement: `cannot fallthrough final case in switch`.

## switch with no condition

A switch with no value compares each case with `true`, so each case is a condition and the first
true one runs. This is the idiomatic way to write a long if-else chain:

```go
package main

import "fmt"

func main() {
	wind := 35
	switch {
	case wind < 20:
		fmt.Println("all sailings run")
	case wind < 35:
		fmt.Println("short crossings only")
	default:
		fmt.Println("harbour closed")
	}
}
```

```text
harbour closed
```

The order of the cases matters: 35 fails both conditions and reaches `default`. Put the narrowest
condition first.

## switch with a short statement

Like an if, a switch may start with a short statement and a semicolon:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	code := "  RET-Oban "
	switch kind, _, _ := strings.Cut(strings.TrimSpace(code), "-"); kind {
	case "SGL":
		fmt.Println("single ticket")
	case "RET":
		fmt.Println("return ticket")
	default:
		fmt.Printf("unknown ticket kind %q\n", kind)
	}
}
```

```text
return ticket
```

`kind` exists only inside the switch.

## Common mistakes

- **An empty case, expecting fall-through.** With `case "sat":` on one line and `case "sun":`
  with the print below it, `"sat"` prints nothing: the empty case runs and the switch ends. Write
  `case "sat", "sun":`.
- **`=` instead of `==`.** `if wind = 20 {` is
  `./main.go:7:10: syntax error: cannot use assignment wind = 20 as value`.
- **Using the short statement's variable later.** `undefined: n`. Declare it before the if when
  you need it afterwards.
- **Comparing text that differs in case, or numbers as text.** `"Yes" == "yes"` is false and
  `"10" < "9"` is true.
- **Cases in the wrong order.** In a switch with no condition, `case wind < 35:` above
  `case wind < 20:` catches every calm day too, so the second case never runs.

## Practice

1. With `score := 72`, print `distinction` for 85 or more, `merit` for 70 to 84, `pass` for 50
   to 69 and `fail` below, using a switch with no condition.
2. With `month := 2`, print how many days the month has (ignore leap years), with a switch that
   lists several months per case.
3. With `code := "gb-EDI"`, use an if with a short statement to print the code in upper case and
   `is a UK airport` when, in upper case, it starts with `GB-`.

### Answers

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	score := 72
	switch {
	case score >= 85:
		fmt.Println("distinction")
	case score >= 70:
		fmt.Println("merit")
	case score >= 50:
		fmt.Println("pass")
	default:
		fmt.Println("fail")
	}

	month := 2
	switch month {
	case 4, 6, 9, 11:
		fmt.Println(30, "days")
	case 2:
		fmt.Println(28, "days")
	default:
		fmt.Println(31, "days")
	}

	code := "gb-EDI"
	if upper := strings.ToUpper(code); strings.HasPrefix(upper, "GB-") {
		fmt.Println(upper, "is a UK airport")
	}
}
```

```text
merit
28 days
GB-EDI is a UK airport
```

## Key takeaways

- `if cond { } else if cond { } else { }`: no parentheses, braces always, `} else {` on one
  line, and the condition must be a `bool`.
- A short statement (`if n := len(s); n > 10 {`) declares a variable that exists only inside
  the statement.
- Strings compare byte by byte: case-sensitive, upper case before lower case.
- A switch runs the first matching case and stops; a case may list several values, and `default`
  catches the rest.
- `fallthrough` continues into the next case without testing it, and is rarely the clearest
  choice.
- `switch { case cond: ... }` replaces an if-else chain; order the cases from the narrowest.

## Further reading

- [The Go Programming Language Specification: If statements](https://go.dev/ref/spec#If_statements)
- [The Go Programming Language Specification: Switch statements](https://go.dev/ref/spec#Switch_statements)
- [Effective Go: Control structures](https://go.dev/doc/effective_go#control-structures)
- [Go by Example: Switch](https://gobyexample.com/switch)
