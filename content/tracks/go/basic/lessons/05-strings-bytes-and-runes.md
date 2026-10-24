---
title: Strings, Bytes and Runes
summary: Understand Go strings as immutable sequences of UTF-8 bytes, tell bytes from runes, write string literals with escapes and backquotes, and search, cut, split, join, trim, replace, compare and build text with the strings package.
minutes: 35
objectives:
  - Explain why len counts bytes, what indexing and slicing a string give, and what a rune is
  - Write interpreted and raw string literals and use the common escape sequences
  - Search, cut, split, join, trim, replace and change the case of text with the strings package
  - Compare strings, with and without case, and build longer text with strings.Builder
---

## Outline

1. A string is a sequence of bytes
2. UTF-8 and runes
3. String literals
4. Joining strings
5. Searching, changing case, trimming and replacing
6. Splitting, joining and cutting
7. Comparing strings
8. Building text with strings.Builder

## A string is a sequence of bytes

A **byte** is 8 bits, a number from 0 to 255; Go's `byte` type is another name for `uint8`. A Go
`string` is a sequence of bytes that cannot be changed. `len` counts those bytes, an **index**
`s[i]` gives one byte (counting from 0), and a **slice** `s[lo:hi]` gives the bytes from `lo` up
to, but not including, `hi`:

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	city := "Málaga"
	fmt.Println(len(city), utf8.RuneCountInString(city))
	fmt.Println(city[0], city[1], city[2])
	fmt.Println(city[0:1], city[1:3], city[3:])
	fmt.Println(string(city[1]))
}
```

```text
7 6
77 195 161
M á laga
Ã
```

Six letters, but seven bytes. `city[0]` is 77, the code of `M`. Leaving out a bound in a slice
means "from the start" or "to the end", as in `city[3:]`. Strings are **immutable**:
`city[0] = 'm'` gives `cannot assign to city[0] (neither addressable nor a map index
expression)`. Every operation that "changes" a string makes a new one.

## UTF-8 and runes

Go source files are written in **UTF-8**, so string literals hold UTF-8 text. UTF-8 writes each
**code point**, Unicode's number for a character, as one to four bytes: one for `M`, two for `á`
(195 and 161).
That is why `string(city[1])` turned the single byte 195 into the wrong letter, `Ã`.

Go calls a code point a **rune**, and `rune` is another name for `int32`. A **rune literal** in
single quotes is a number: `'á'` is 225. `utf8.RuneCountInString` counts runes, and converting to
`[]rune` or `[]byte` gives the runes or the bytes one by one (these are slices, lesson 10):

```go
package main

import "fmt"

func main() {
	accent := 'á'
	fmt.Println(accent, string(accent))
	city := "Málaga"
	fmt.Println([]byte(city))
	fmt.Println([]rune(city))
	fmt.Println(string([]rune(city)[1]), len([]rune(city)))
}
```

```text
225 á
[77 195 161 108 97 103 97]
[77 225 108 97 103 97]
á 6
```

Index `[]rune(s)` to reach the nth character. For plain ASCII text, such as codes and numbers,
bytes and runes are the same. Lesson 8 walks through a string rune by rune with `for range`.

## String literals

An **interpreted string literal** in double quotes understands **escape sequences**: `\n` (new
line), `\t` (tab), `\"` (a double quote), `\\` (a backslash) and `\u00e9` (a code point by
number). A **raw string literal** in backquotes takes every character as written, including
backslashes and line breaks:

```go
package main

import "fmt"

func main() {
	fmt.Println("Platform 2\tDeparts 09:15\nPlatform 4\tDeparts 09:40")
	fmt.Println("Say \"hola\" in Málaga, caf\u00e9, back\\slash")
	path := `C:\trains\timetable.txt`
	fmt.Println(path)
	fmt.Println("C:\trains")
}
```

```text
Platform 2	Departs 09:15
Platform 4	Departs 09:40
Say "hola" in Málaga, café, back\slash
C:\trains\timetable.txt
C:	rains
```

In double quotes, `\t` in a Windows path becomes a tab: use backquotes for paths and patterns.

## Joining strings

`+` joins two strings into a new one, and `+=` appends to a variable. Both sides must be
strings; lesson 4 turned numbers into text with `strconv.Itoa`.

```go
ticket := "Málaga"
ticket += " to "
ticket = ticket + "Granada"
fmt.Println(ticket)
```

```text
Málaga to Granada
```

## Searching, changing case, trimming and replacing

The `strings` package holds the everyday tools. None changes its argument; each returns a result:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	route := strings.TrimSpace("  Málaga - Granada - Sevilla  ")
	fmt.Println(route)
	fmt.Println(strings.Contains(route, "Granada"), strings.HasPrefix(route, "Má"), strings.HasSuffix(route, "villa"))
	fmt.Println(strings.Index(route, "Granada"), strings.Index(route, "Cádiz"))
	fmt.Println(strings.ToUpper(route))
	fmt.Println(strings.Trim("--Granada--", "-"))
	fmt.Println(strings.ReplaceAll(route, " - ", " > "))
	fmt.Println(strings.Replace("a-b-c-d", "-", "+", 2))
	fmt.Println(strings.Repeat("=", 10))
}
```

```text
Málaga - Granada - Sevilla
true true true
10 -1
MÁLAGA - GRANADA - SEVILLA
Granada
Málaga > Granada > Sevilla
a+b+c-d
==========
```

`TrimSpace` removes spaces, tabs and new lines at both ends. `Index` gives the **byte** position
of the first match (`Málaga - ` is 10 bytes), or -1 when there is none. `ToUpper` and `ToLower`
know Unicode, so `á` becomes `Á`. `Trim(s, cutset)` removes any of the characters in `cutset`
from both ends. `Replace` changes at most `n` matches, `ReplaceAll` every one.

## Splitting, joining and cutting

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	stops := strings.Split("Málaga,Granada,Sevilla", ",")
	fmt.Println(stops, len(stops), stops[1])
	fmt.Println(strings.Join(stops, " > "))
	fmt.Println(strings.Fields("  09:15   platform 2  "))

	city, at, found := strings.Cut("Granada@09:15", "@")
	fmt.Println(city, at, found)

	file, ext, _ := strings.CutLast("timetable.2026.txt", ".")
	fmt.Println(file, ext)
	first, rest, _ := strings.Cut("timetable.2026.txt", ".")
	fmt.Println(first, rest)
}
```

```text
[Málaga Granada Sevilla] 3 Granada
Málaga > Granada > Sevilla
[09:15 platform 2]
Granada 09:15 true
timetable.2026 txt
timetable 2026.txt
```

`Split` returns a `[]string`, a list of strings printed in square brackets; `stops[1]` is the
second one, counting from 0 (lesson 10 covers slices). `Join` does the opposite. `Fields` splits
on any run of spaces and drops empty pieces. `Cut` splits around the **first** separator and
returns three values: the text before, the text after, and whether the separator was found.
`CutLast`, new in Go 1.27, splits around the **last** one, which is what a file extension needs.

## Comparing strings

`==` and `!=` compare byte by byte, so case matters. `strings.EqualFold` ignores case, Unicode
included. `<` and `>` compare bytes too, which puts every capital letter before every small one:

```go
fmt.Println(strings.EqualFold("málaga", "MÁLAGA"), "málaga" == "MÁLAGA")
fmt.Println("apple" < "banana", "Zebra" < "apple")
```

```text
true false
true true
```

## Building text with strings.Builder

Each `+` copies both strings into a new one. To build a long text from many pieces, a
`strings.Builder` collects them and copies once:

```go
var board strings.Builder
board.WriteString("Departures\n")
board.WriteString("09:15 Granada\n")
board.WriteString("09:40 Sevilla")
fmt.Println(board.String())
fmt.Println(board.Len())
```

```text
Departures
09:15 Granada
09:40 Sevilla
38
```

Its zero value is ready to use. `String` returns the text and `Len` its length in bytes. It pays
off when you build text in a loop (lesson 8).

## Common mistakes

- **`len` for characters.** `len("Zürich")` is 7. Count characters with
  `utf8.RuneCountInString`.
- **Indexing for a character.** `s[1]` is a byte. `string(s[1])` for `"Málaga"` gives `Ã`; use
  `[]rune(s)[1]`.
- **`Trim` for a prefix.** The second argument is a set of characters: `strings.Trim("banana",
  "ban")` removes everything and gives `""`. Use `strings.TrimPrefix("banana", "ban")`, which gives
  `ana`.
- **Backslashes in double quotes.** `"C:\trains"` prints `C:` and a tab. Use backquotes.

## Practice

1. What are `len` and `utf8.RuneCountInString` of `"Zürich"`?
2. Take the time out of `"Ferry to Bergen @ 08:30"` with `strings.Cut`, without spaces around it.
3. Turn `"oslo;bergen;tromsø"` into `OSLO - BERGEN - TROMSØ`.

### Answers

```go
package main

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

func main() {
	city := "Zürich"
	fmt.Println(len(city), utf8.RuneCountInString(city))

	_, at, _ := strings.Cut("Ferry to Bergen @ 08:30", "@")
	fmt.Println(strings.TrimSpace(at))

	stops := strings.Split("oslo;bergen;tromsø", ";")
	fmt.Println(strings.ToUpper(strings.Join(stops, " - ")))
}
```

```text
7 6
08:30
OSLO - BERGEN - TROMSØ
```

## Key takeaways

- A string is an immutable sequence of UTF-8 bytes: `len`, `s[i]` and `s[lo:hi]` work in bytes.
- A rune is a Unicode code point (`int32`); count runes with `utf8.RuneCountInString`.
- `"..."` understands escapes such as `\n`, `\t` and `\"`; backquotes are raw.
- The `strings` package returns new strings: `Contains`, `Index`, `ToUpper`, `TrimSpace`,
  `Split`, `Join`, `Fields`, `Cut`, `CutLast`, `ReplaceAll`, `Repeat`, `EqualFold`.
- `==` is exact and case-sensitive; `strings.Builder` builds long text efficiently.

## Further reading

- [Package strings](https://pkg.go.dev/strings)
- [Go blog: Strings, bytes, runes and characters in Go](https://go.dev/blog/strings)
- [The Go Programming Language Specification: String literals](https://go.dev/ref/spec#String_literals)
- [Go by Example: Strings and Runes](https://gobyexample.com/strings-and-runes)
