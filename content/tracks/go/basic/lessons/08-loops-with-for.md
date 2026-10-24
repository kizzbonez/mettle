---
title: Repeating with for
summary: Repeat work with Go's only loop, for, in its three-part, condition-only and endless forms, steer it with break, continue and labels, and range over integers, strings (rune by rune) and a first slice, with the common sum, count, search and build patterns.
minutes: 35
objectives:
  - Write the three-part, condition-only and endless forms of for, and stop or skip iterations with break and continue
  - Leave nested loops at once with a label and break Label or continue Label
  - Range over an integer, a string (byte index and rune) and a slice literal
  - Write the sum, count, search and build-a-string loop patterns, avoiding the off-by-one panic
---

## Outline

1. The three-part for
2. A condition only, or no condition at all
3. continue
4. range over an integer
5. range over a string
6. A first look at range over a slice
7. Labels for nested loops
8. Each iteration has its own variable
9. Loop patterns: sum, count, search, build

## The three-part for

Go has one loop keyword, `for`, and it covers every kind of loop. Its classic form has three
parts separated by semicolons, with no parentheses around them:

```go
package main

import "fmt"

func main() {
	for lap := 1; lap <= 3; lap++ {
		fmt.Println("lap", lap)
	}
	for n := 10; n > 0; n -= 4 {
		fmt.Print(n, " ")
	}
	fmt.Println()
}
```

```text
lap 1
lap 2
lap 3
10 6 2 
```

The **init statement** `lap := 1` runs once. The **condition** `lap <= 3` is tested before every
**iteration** (one run of the body), and the loop ends when it is false. The **post statement**
`lap++` runs after each iteration. `lap` exists only inside the loop, like the variable of an
if's short statement. The braces are required, as for if.

## A condition only, or no condition at all

Leave out the init and post statements and you have what other languages call a while loop:

```go
package main

import "fmt"

func main() {
	grams := 50
	hours := 0
	for grams < 800 {
		grams *= 2
		hours += 4
	}
	fmt.Println(grams, "g after", hours, "hours")
}
```

```text
800 g after 16 hours
```

Use it when you cannot know the number of iterations in advance. Without a condition, the loop
runs for ever, until a **break** statement ends it:

```go
package main

import "fmt"

func main() {
	n := 6
	steps := 0
	for {
		if n == 1 {
			break
		}
		if n%2 == 0 {
			n /= 2
		} else {
			n = 3*n + 1
		}
		steps++
	}
	fmt.Println("reached 1 in", steps, "steps")
}
```

```text
reached 1 in 8 steps
```

`break` jumps to the first statement after the loop. An endless `for {}` suits loops whose exit
is easiest to test in the middle of the body.

## continue

**continue** skips the rest of the body and starts the next iteration; in a three-part loop the
post statement still runs:

```go
package main

import "fmt"

func main() {
	for seat := 1; seat <= 10; seat++ {
		if seat%4 == 0 {
			continue
		}
		fmt.Print(seat, " ")
	}
	fmt.Println()
}
```

```text
1 2 3 5 6 7 9 10 
```

## range over an integer

Since Go 1.22, `for i := range n` counts `i` from 0 up to n-1. Leave out the variable when you
only need the repetition. A count of 0 or less runs no iterations:

```go
package main

import "fmt"

func main() {
	for i := range 3 {
		fmt.Print(i, " ")
	}
	fmt.Println()
	for range 3 {
		fmt.Print("beep ")
	}
	fmt.Println()
}
```

```text
0 1 2 
beep beep beep 
```

## range over a string

Lesson 05 showed that a string is bytes in UTF-8, and that `s[i]` is one byte. `range` over a
string decodes it instead: each iteration gives the **byte index** where a character starts and
the character itself as a **rune**:

```go
package main

import "fmt"

func main() {
	word := "crème"
	for i, r := range word {
		fmt.Printf("%d:%c ", i, r)
	}
	fmt.Println()
	for i := 0; i < len(word); i++ {
		fmt.Printf("%d:%c ", i, word[i])
	}
	fmt.Println()
}
```

```text
0:c 1:r 2:è 4:m 5:e 
0:c 1:r 2:Ã 3:¨ 4:m 5:e 
```

`è` takes two bytes, so the index jumps from 2 to 4. The byte loop splits it into two
meaningless characters. To go through the characters of text, use `range`.

## A first look at range over a slice

A **slice** is a list of values of one type; `[]string{"Oban", "Craignure"}` is a slice of
strings written out in full (lesson 10 covers slices). `range` gives each index and value:

```go
package main

import "fmt"

func main() {
	for i, stop := range []string{"Oban", "Craignure", "Fionnphort"} {
		fmt.Println(i+1, stop)
	}
	for _, stop := range []string{"Oban", "Craignure"} {
		fmt.Print(stop, "; ")
	}
	fmt.Println()
}
```

```text
1 Oban
2 Craignure
3 Fionnphort
Oban; Craignure; 
```

Every variable you declare must be used, so write `_` for the index when you need only the value.

## Labels for nested loops

A loop inside a loop is **nested**. A plain `break` leaves only the innermost loop. To leave both,
put a **label** (a name and a colon) before the outer loop and write `break` with that name;
`continue Label` likewise moves on to the outer loop's next iteration:

```go
package main

import "fmt"

func main() {
	rows := []string{"XXXX", "XX.X", "X..X"}

	for r, row := range rows {
		for s, seat := range row {
			if seat == '.' {
				fmt.Println("free: row", r+1, "seat", s+1)
				break
			}
		}
	}

search:
	for r, row := range rows {
		for s, seat := range row {
			if seat == '.' {
				fmt.Println("first free: row", r+1, "seat", s+1)
				break search
			}
		}
	}
}
```

```text
free: row 2 seat 3
free: row 3 seat 2
first free: row 2 seat 3
```

The plain `break` lets the outer loop go on to the next row; `break search` ends both loops.

## Each iteration has its own variable

Since Go 1.22, every iteration gets a fresh copy of the loop variables. Before, all iterations
shared one variable, so code that kept the variable for later, such as a function value (lesson
09) or a goroutine (Advanced 01), saw only its last value. A module whose `go.mod` says `go 1.22`
or later gets the new behaviour, so you can rely on it.

## Loop patterns: sum, count, search, build

Most loops are one of four patterns: add up, count what matches, search and stop, or build text:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	temps := []int{12, 15, 9, 17, 14}
	sum, warm := 0, 0
	for _, t := range temps {
		sum += t
		if t >= 15 {
			warm++
		}
	}
	fmt.Printf("average %.1f, warm days %d\n", float64(sum)/float64(len(temps)), warm)

	firstCold := -1
	for i, t := range temps {
		if t < 10 {
			firstCold = i
			break
		}
	}
	fmt.Println("first cold day:", firstCold)

	var b strings.Builder
	for i := range 5 {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(fmt.Sprint(i * i))
	}
	fmt.Println(b.String())
}
```

```text
average 13.4, warm days 2
first cold day: 2
0, 1, 4, 9, 16
```

The search starts from -1, a value no index can have, so after the loop you can tell "not
found" from "found at 0". The separator goes before every item except the first.

## Common mistakes

- **Going one step too far.** `for i := 0; i <= len(word); i++` reads `word[5]` of a five-byte
  word: `panic: runtime error: index out of range [5] with length 5`. Use `<`, or `range`.
- **`break` inside a switch.** In a loop, `break` in a switch case leaves only the switch, and the
  loop goes on. Label the loop and write `break Label`.
- **An unused index.** `for i, stop := range stops` without using `i` is
  `./main.go:6:6: declared and not used: i`. Write `for _, stop := range stops`.
- **A loop that never ends.** `for grams < 800 {}` without changing `grams` hangs the program.
  Make sure every iteration moves towards the condition becoming false.

## Practice

1. Add up the numbers from 1 to 100 that are divisible by 3 or by 5.
2. Count the vowels, accented ones included, in `"Façade à la crème"`.
3. Count the years until 1000 euros at 7% interest a year reach 2000.

### Answers

```go
package main

import "fmt"

func main() {
	total := 0
	for n := 1; n <= 100; n++ {
		if n%3 == 0 || n%5 == 0 {
			total += n
		}
	}
	fmt.Println(total)

	vowels := 0
	for _, r := range "Façade à la crème" {
		switch r {
		case 'a', 'e', 'i', 'o', 'u', 'à', 'è':
			vowels++
		}
	}
	fmt.Println(vowels)

	years := 0
	for money := 1000.0; money < 2000; money *= 1.07 {
		years++
	}
	fmt.Println(years)
}
```

```text
2418
7
11
```

## Key takeaways

- `for` is Go's only loop: `for init; cond; post {}`, `for cond {}` and `for {}`.
- `break` leaves the loop, `continue` starts the next iteration; with a label they act on an
  outer loop.
- `for i := range n` counts from 0 to n-1; over a string, `range` gives byte indexes and runes;
  over a slice, indexes and values.
- Each iteration has its own loop variable since Go 1.22.
- Use `_` for a value you do not need, and `<` rather than `<=` with `len`.

## Further reading

- [The Go Programming Language Specification: For statements](https://go.dev/ref/spec#For_statements)
- [Effective Go: For](https://go.dev/doc/effective_go#for)
- [Go blog: Fixing For Loops in Go 1.22](https://go.dev/blog/loopvar-preview)
- [Go by Example: For](https://gobyexample.com/for)
