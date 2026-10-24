---
title: Errors as Values
summary: Return errors as ordinary values next to a function's result, create them with errors.New and fmt.Errorf, check them with if err != nil, add context and wrap with %w, recognise sentinel errors with errors.Is, and report a fatal error from main with an exit code.
minutes: 35
objectives:
  - Write functions that return (T, error) and create errors with errors.New and fmt.Errorf
  - Check every error with if err != nil and either handle it or return it with context
  - Wrap errors with %w and recognise a sentinel error through the wrapping with errors.Is
  - Write error messages in Go style and end a program with a message on standard error and exit code 1
---

## Outline

1. An error is a value
2. Returning errors of your own
3. Handle it or return it
4. Wrapping with %w, and sentinel errors
5. Writing good error messages
6. Errors in main, and panics

## An error is a value

Text that should be a number is not; a seat that should be free is taken. Many languages throw an
exception that jumps out of the function. In Go, a function that can fail returns an extra result
of the built-in type **`error`**, last in its result list. A nil error means success; any other
value describes what went wrong. (`error` is an interface: any value with an `Error() string`
method. Medium 03 explains interfaces.) You met one in lesson 04: `strconv.Atoi` returns `(int,
error)`.

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	for _, text := range []string{"42", "12a", "", "99999999999999999999"} {
		n, err := strconv.Atoi(text)
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Println("number:", n)
	}
}
```

```text
number: 42
error: strconv.Atoi: parsing "12a": invalid syntax
error: strconv.Atoi: parsing "": invalid syntax
error: strconv.Atoi: parsing "99999999999999999999": value out of range
```

When the error is not nil, the other result means nothing (here it is 0), so check the error
before you use the value.

## Returning errors of your own

`errors.New("text")` makes an error with a fixed message. `fmt.Errorf` works like `fmt.Sprintf`
(lesson 06) but returns an error, so the message can include the values involved:

```go
package main

import (
	"errors"
	"fmt"
	"strconv"
)

// parseSeats reads how many seats a passenger wants: a whole number from 1 to 8.
func parseSeats(text string) (int, error) {
	if text == "" {
		return 0, errors.New("no seat count")
	}
	n, err := strconv.Atoi(text)
	if err != nil {
		return 0, err
	}
	if n < 1 || n > 8 {
		return 0, fmt.Errorf("seat count %d is not from 1 to 8", n)
	}
	return n, nil
}

func main() {
	for _, text := range []string{"3", "", "two", "12"} {
		seats, err := parseSeats(text)
		if err != nil {
			fmt.Printf("%q: %v\n", text, err)
			continue
		}
		fmt.Printf("%q: %d seats\n", text, seats)
	}
}
```

```text
"3": 3 seats
"": no seat count
"two": strconv.Atoi: parsing "two": invalid syntax
"12": seat count 12 is not from 1 to 8
```

On failure, return the zero value with the error; on success, return the value with `nil`.

## Handle it or return it

Every call that returns an error is followed by `if err != nil`, and the code inside does one of
two things. It **handles** the error, when this function knows what to do about it: print it and
move to the next line, use a default, ask again. Or it **returns** the error to its caller,
because only the caller knows what to do. `parseSeats` cannot decide what a bad seat count means
for the whole program, so it returns the error; `main` can, so it prints it and carries on.

Go chose this on purpose. Each failure is visible in the function's signature and checked where
it happens, with ordinary `if` statements, instead of jumping to a `catch` somewhere else. The
error handling is indented and comes first; the normal path stays at the left margin. It costs
some lines, and the compiler helps: an `err` you assign and never read does not compile:

```text
./main.go:9:5: declared and not used: err
```

## Wrapping with %w, and sentinel errors

An error passed up unchanged loses where it happened: "invalid syntax" does not say which booking.
Add **context** on the way up with `fmt.Errorf` and the verb **`%w`**, which puts the original
error's text in the message and also keeps the error itself inside the new one: **wrapping**.

A **sentinel error** is an error stored in a package-level variable so that callers can recognise
it; its name starts with `Err`. `errors.Is(err, target)` reports whether `err` is `target` or wraps
it, however many layers deep:

```go
package main

import (
	"errors"
	"fmt"
	"strconv"
)

// ErrFull means the minibus has no seats left for the request.
var ErrFull = errors.New("minibus full")

func book(free int, request string) (int, error) {
	seats, err := strconv.Atoi(request)
	if err != nil {
		return free, fmt.Errorf("booking %q: %w", request, err)
	}
	if seats > free {
		return free, fmt.Errorf("booking %d seats with %d free: %w", seats, free, ErrFull)
	}
	return free - seats, nil
}

func main() {
	free := 5
	for _, request := range []string{"2", "4", "x", "3"} {
		left, err := book(free, request)
		switch {
		case errors.Is(err, ErrFull):
			fmt.Println("waiting list:", err)
		case err != nil:
			fmt.Println("rejected:", err, errors.Is(err, strconv.ErrSyntax))
		default:
			free = left
			fmt.Println("booked, seats left:", free)
		}
	}
	_, err := book(1, "2")
	fmt.Println(err == ErrFull, errors.Is(err, ErrFull))
}
```

```text
booked, seats left: 3
waiting list: booking 4 seats with 3 free: minibus full
rejected: booking "x": strconv.Atoi: parsing "x": invalid syntax true
booked, seats left: 0
false true
```

`main` treats a full minibus differently from a typing mistake without reading the message text,
which may change. The last line shows why `==` is not enough: the returned error wraps `ErrFull`,
so it is a different value, while `errors.Is` looks inside. The standard library has sentinels
too: `strconv.ErrSyntax` is inside every "invalid syntax" error from `strconv`.

With `%v` instead of `%w` the message is identical, but nothing is kept inside, so
`errors.Is(err, ErrFull)` is `false`. Medium 05 goes further: your own error types, `errors.As`,
joining errors.

## Writing good error messages

Error messages are read as a chain, `booking "x": strconv.Atoi: parsing "x": invalid syntax`, so
the Go convention is: lower case and no full stop at the end, since more text may follow; context
first, then a colon and the wrapped error; and the values involved, quoted with `%q` when they are
text. `Error: Could not book seats.` breaks all three; `booking 4 seats with 3 free: minibus full`
follows them.

## Errors in main, and panics

`main` has no caller to return an error to. When an error means the program cannot go on, print it
to **standard error** (lesson 06) and end with a non-zero **exit code**, which tells the shell or a
script that the program failed. `os.Exit(1)` ends the program at once with that code:

```go
package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	seats, err := strconv.Atoi("seven")
	if err != nil {
		fmt.Fprintln(os.Stderr, "minibus:", err)
		os.Exit(1)
	}
	fmt.Println("seats:", seats)
}
```

```sh
$ go build -o minibus . && ./minibus; echo "exit code: $?"
minibus: strconv.Atoi: parsing "seven": invalid syntax
exit code: 1
```

Errors are for things that can go wrong while the program is correct: bad input, a full minibus,
a missing file. A **panic**, like the nil-map write in lesson 11, is for bugs, states that should be
impossible. Do not call `panic` for ordinary errors; Medium 06 covers panics and `recover`.

## Common mistakes

- **Ignoring the error.** `n, _ := strconv.Atoi("seven")` gives 0 without complaint, and the bad
  value travels on. Check every error.
- **Comparing with `==`.** `err == ErrFull` is `false` once the error is wrapped. Use `errors.Is`.
- **Wrapping with `%v`.** The message looks right, but `errors.Is` finds nothing. Use `%w`.
- **Capitalised, punctuated messages.** They read badly in a chain. Write `parsing seats: ...`.

## Practice

1. Write `parsePercent(text string) (int, error)`: wrap `strconv`'s error with the text as
   context, and reject numbers outside 0 to 100.
2. Define `ErrEmpty` and `checkName(name string) error`, which returns it for a blank name. Wrap
   the result with `%w` and test it with `errors.Is`.
3. Rewrite the message `Error: Could not read the file data.txt.` in Go style.

### Answers

```go
package main

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// ErrEmpty means a name was blank.
var ErrEmpty = errors.New("empty name")

func parsePercent(text string) (int, error) {
	n, err := strconv.Atoi(text)
	if err != nil {
		return 0, fmt.Errorf("percent %q: %w", text, err)
	}
	if n < 0 || n > 100 {
		return 0, fmt.Errorf("percent %d is not from 0 to 100", n)
	}
	return n, nil
}

func checkName(name string) error {
	if strings.TrimSpace(name) == "" {
		return ErrEmpty
	}
	return nil
}

func main() {
	for _, text := range []string{"75", "120", "half"} {
		n, err := parsePercent(text)
		fmt.Println(n, err)
	}
	err := fmt.Errorf("passenger 3: %w", checkName("  "))
	fmt.Println(err, errors.Is(err, ErrEmpty))
	fmt.Println(checkName("Ada") == nil)
}
```

```text
75 <nil>
0 percent 120 is not from 0 to 100
0 percent "half": strconv.Atoi: parsing "half": invalid syntax
passenger 3: empty name true
true
```

A nil error prints as `<nil>`. For exercise 3: `reading "data.txt": ...`, followed by the cause.

## Key takeaways

- A function that can fail returns `error` last; `nil` means success.
- Create errors with `errors.New` and `fmt.Errorf`; check each with `if err != nil`.
- Handle an error where you know what to do; otherwise return it with context.
- `%w` wraps; `errors.Is` finds a sentinel error through any number of wraps.
- Messages: lower case, no final punctuation, context first.
- In `main`, print to `os.Stderr` and `os.Exit(1)`; panics are for bugs.

## Further reading

- [Package errors](https://pkg.go.dev/errors)
- [The Go Blog: Error handling and Go](https://go.dev/blog/error-handling-and-go)
- [The Go Blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [Go Wiki: Code Review Comments, Error Strings](https://go.dev/wiki/CodeReviewComments#error-strings)
