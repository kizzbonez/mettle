---
title: Formatting Output with fmt
summary: Print values exactly the way you want with the Print, Println and Printf families, format verbs, width and precision, send text to standard output or standard error, and let go vet catch verbs that do not match their arguments.
minutes: 35
objectives:
  - Choose between Print, Println and Printf, and between the Print, Sprint and Fprint forms
  - Format integers, floats, strings, runes and booleans with the right verb, including %v, %T and %q
  - Set width, precision, padding and alignment to print an aligned table
  - Read fmt's %!verb markers and go vet's printf reports, and fix the call
---

## Outline

1. Print, Println and Printf
2. The general verbs: %v, %#v, %T and %%
3. Verbs for numbers, runes, text and booleans
4. Width, precision and alignment
5. Printing a table
6. Sprintf and Fprintln: where the text goes
7. When a verb does not match its argument

## Print, Println and Printf

You have used `fmt.Println` since lesson 02. The fmt package has three printing functions, and
they differ in how they join their arguments:

```go
package main

import "fmt"

func main() {
	tickets := 3
	price := 4.5
	fmt.Print("tickets:", tickets, "price:", price, "\n")
	fmt.Print(tickets, price, "\n")
	fmt.Println("tickets:", tickets, "price:", price)
	fmt.Printf("tickets: %d, price: %.2f\n", tickets, price)
}
```

```text
tickets:3price:4.5
3 4.5
tickets: 3 price: 4.5
tickets: 3, price: 4.50
```

- `fmt.Print` adds a space between two arguments only when **neither** is a string, and no
  newline: the `"\n"` is yours.
- `fmt.Println` always puts a space between arguments and ends the line.
- `fmt.Printf` takes a **format string** first. Its text is copied as it is, and each **verb**
  (a `%` and a letter) is replaced by the next argument, formatted as the verb says: `%d` is a
  whole number in decimal, `%.2f` a float with two decimals. Printf adds nothing else, not even
  a newline, so most format strings end in `\n`.

## The general verbs

Three verbs work with a value of any type, and `%%` needs no value at all:

```go
package main

import "fmt"

func main() {
	seats := 42
	fare := 12.5
	route := "Oban"
	open := true
	fmt.Printf("%v %v %v %v\n", seats, fare, route, open)
	fmt.Printf("%#v %#v %#v %#v\n", seats, fare, route, open)
	fmt.Printf("%T %T %T %T\n", seats, fare, route, open)
	fmt.Printf("100%% full\n")
}
```

```text
42 12.5 Oban true
42 12.5 "Oban" true
int float64 string bool
100% full
```

`%v` is the **default format**, the one Println uses. `%#v` writes the value as Go source code
would, so a string keeps its quotes: it tells the string `"42"` from the number `42`. `%T`
prints the type, and `%%` prints a percent sign without using an argument. You will also meet
`%+v`, which adds field names when printing a struct (lesson 12).

## Verbs for numbers, runes, text and booleans

```go
package main

import "fmt"

func main() {
	n := 255
	fmt.Printf("%d %b %o %x %X %#x %t\n", n, n, n, n, n, n, n > 100)

	r := 'é'
	fmt.Printf("%c %d %U %q\n", r, r, r, r)

	f := 1234.5678
	fmt.Printf("%f %.2f %.0f %e %g\n", f, f, f, f, f)

	s := "say \"hi\"\tnow"
	fmt.Printf("%s\n%q\n", s, s)
}
```

```text
255 11111111 377 ff FF 0xff true
é 233 U+00E9 'é'
1234.567800 1234.57 1235 1.234568e+03 1234.5678
say "hi"	now
"say \"hi\"\tnow"
```

- Integers: `%d` decimal, `%b` binary, `%o` octal, `%x` and `%X` hexadecimal. The `#` **flag**
  adds the `0x` prefix. Booleans use `%t`.
- Runes (lesson 05): `%c` prints the character, `%d` its number, `%U` its code point and `%q` a
  quoted rune literal.
- Floats: `%f` prints six decimals; a **precision** such as `.2` sets how many, rounding the
  value. `%e` uses an exponent, and `%g`, the default for floats, prints only the digits needed.
- Strings: `%s` prints the text as it is; `%q` prints a quoted Go string, so tabs, quotes and
  spaces at the ends become visible.

`%p` prints a memory address; it needs a pointer (lesson 13).

## Width, precision and alignment

A number after the `%` and its flags is the **width**: the least number of characters the value
takes. Shorter values are padded with spaces on the left, so they line up on the right. The `-`
flag pads on the right instead, `0` pads a number with zeros, and `+` always prints a sign. For
a float the precision follows the width: `%8.2f` is eight characters with two decimals. On a
string, a precision cuts it. The brackets show where each field starts and ends:

```go
package main

import "fmt"

func main() {
	fmt.Printf("[%5d] [%-5d] [%05d] [%+d]\n", 42, 42, 42, 42)
	fmt.Printf("[%8.2f] [%-8.2f] [%08.3f]\n", 3.14159, 3.14159, 3.14159)
	fmt.Printf("[%10s] [%-10s] [%.3s]\n", "Mull", "Mull", "Lismore")
	fmt.Printf("[%3d] [%-3s]\n", 123456, "Tobermory")
	fmt.Printf("[%-6s] [%-6s]\n", "cafe", "café")
}
```

```text
[   42] [42   ] [00042] [+42]
[    3.14] [3.14    ] [0003.142]
[      Mull] [Mull      ] [Lis]
[123456] [Tobermory]
[cafe  ] [café  ]
```

A width is a minimum, never a limit: `%3d` prints all six digits. And a width counts runes, not
bytes: `"café"` is five bytes but four runes, so it gets the same two spaces as `"cafe"`.

## Printing a table

The rows of a table share one set of widths, so keep the format in a constant. Left-align text
and right-align numbers, so that the digits of a column line up:

```go
package main

import "fmt"

func main() {
	const header = "%-12s %5s %8s\n"
	const row = "%-12s %5d %8.2f\n"
	fmt.Printf(header, "Route", "Cars", "Takings")
	fmt.Printf(row, "Oban-Mull", 64, 1408.5)
	fmt.Printf(row, "Lismore", 7, 98.0)
	fmt.Printf(row, "Coll-Tiree", 112, 3021.75)
}
```

```text
Route         Cars  Takings
Oban-Mull       64  1408.50
Lismore          7    98.00
Coll-Tiree     112  3021.75
```

When the widths depend on the data, package `text/tabwriter` measures the cells for you.

## Sprintf and Fprintln: where the text goes

`Print`, `Println` and `Printf` write to **standard output**, the program's normal output.
`Sprint`, `Sprintln` and `Sprintf` print nothing: they return the text as a string. `Fprint`,
`Fprintln` and `Fprintf` take a destination first: `os.Stdout`, or `os.Stderr`, **standard
error**, a second stream meant for warnings and errors.

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	cars := 64
	limit := 60
	summary := fmt.Sprintf("%d cars, %d over the limit", cars, cars-limit)
	fmt.Println(summary)
	fmt.Println(len(summary))
	fmt.Fprintln(os.Stderr, "warning: sailing overbooked by", cars-limit)
	fmt.Fprintf(os.Stdout, "boarding %d of %d\n", limit, cars)
}
```

```text
64 cars, 4 over the limit
25
warning: sailing overbooked by 4
boarding 60 of 64
```

A terminal shows both streams, but they stay separate, so saved output is not mixed with
warnings. `2>/dev/null` throws standard error away:

```sh
go run . 2>/dev/null
```

```text
64 cars, 4 over the limit
25
boarding 60 of 64
```

`fmt.Errorf` formats like Sprintf but makes an error value; lesson 14 uses it.

## When a verb does not match its argument

The compiler does not check a format string. If a verb does not fit, the program runs and prints
a marker where the value should be:

```go
package main

import "fmt"

func main() {
	cars := "sixty"
	fmt.Printf("%d cars\n", cars)
	fmt.Printf("%d cars and %d vans\n", 64)
	fmt.Printf("%d cars\n", 64, 3)
	fmt.Println("total: %d", 64)
}
```

```text
%!d(string=sixty) cars
64 cars and %!d(MISSING) vans
64 cars
%!(EXTRA int=3)total: %d 64
```

`%!d(string=sixty)` means `%d` got the string `sixty`; `%!d(MISSING)` that no argument was
left; `%!(EXTRA int=3)` that an argument was never used. Println has no verbs, so
it printed `%d` as text. `go vet` (lesson 02) finds all four before you run anything:

```text
main.go:7:14: fmt.Printf format %d has arg cars of wrong type string
main.go:8:26: fmt.Printf format %d reads arg #2, but call has 1 arg
main.go:9:2: fmt.Printf call needs 1 arg but has 2 args
main.go:10:2: fmt.Println call has possible Printf formatting directive %d
```

The labs here build your code with these checks on: a mismatched verb stops the build.

## Common mistakes

- **No newline after Printf.** `fmt.Printf("%d", 5)` then `fmt.Printf("%d\n", 6)` prints `56`.
  End the format with `\n`.
- **A whole number for a float verb.** With `98` instead of `98.0` in the table above, the row
  prints `Lismore          7 %!f(int=      98)`: the untyped constant becomes an `int`. vet says
  `fmt.Printf format %8.2f has arg 98 of wrong type int`.
- **Expecting halves to round up.** `%.2f` prints 2.675 as `2.67` and 0.125 as `0.12`: 2.675 is
  stored as slightly less (lesson 04), and an exact half rounds to the even digit. For money,
  keep whole cents in an `int` and print `cents/100` and `cents%100` with `%d.%02d`.

## Practice

1. With `name := "Lismore"` and `cars := 7`, print `Lismore: 7 cars` with Printf. Then build the
   same text with Sprintf and print it with its length.
2. Print `rate := 0.075` as a percentage with one decimal: `7.5%`.
3. Print the type and the Go syntax of `'A'` and of `"A"`.

### Answers

```go
package main

import "fmt"

func main() {
	name := "Lismore"
	cars := 7
	fmt.Printf("%s: %d cars\n", name, cars)
	line := fmt.Sprintf("%s: %d cars", name, cars)
	fmt.Println(line, len(line))

	rate := 0.075
	fmt.Printf("%.1f%%\n", rate*100)

	fmt.Printf("%T %#v, %T %#v\n", 'A', 'A', "A", "A")
}
```

```text
Lismore: 7 cars
Lismore: 7 cars 15
7.5%
int32 65, string "A"
```

A rune is an `int32`, so `%T` says `int32` and `%#v` shows the number 65.

## Key takeaways

- Print adds spaces only between non-strings, Println always adds spaces and a newline, and
  Printf adds only what its format says.
- `%v` default, `%#v` Go syntax, `%T` type, `%%` a percent sign; `%d %x %f %e %g %s %q %c %U %t`
  for specific types.
- A width is a minimum and counts runes; `-` left-aligns, `0` pads with zeros, `.N` sets decimals.
- Sprintf returns a string; `fmt.Fprintln(os.Stderr, ...)` writes to standard error.
- A wrong verb prints `%!verb(type=value)`; `go vet` reports it first.

## Further reading

- [Package fmt](https://pkg.go.dev/fmt)
- [Command vet](https://pkg.go.dev/cmd/vet)
- [Go by Example: String Formatting](https://gobyexample.com/string-formatting)
