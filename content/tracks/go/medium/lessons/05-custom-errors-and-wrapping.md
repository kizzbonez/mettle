---
title: Custom Errors and Wrapping
summary: Define error types that carry details, wrap errors into a chain, search it with errors.Is and Go 1.26's errors.AsType, join errors, and design what an error API promises.
minutes: 35
objectives:
  - Define a custom error type that carries details and return it as an error
  - Wrap errors with %w and search the chain with errors.Is, errors.As and errors.AsType
  - Combine several errors with errors.Join or several %w verbs
  - Choose between %w and %v at an API boundary, and fix Go 1.27's vet report about wrapping a pointer
---

## Outline

1. Custom error types
2. Wrapping builds a chain
3. Finding a type in the chain
4. Several errors at once
5. Wrapping a pointer: the Go 1.27 vet check
6. Designing an error API

## Custom error types

Basic lesson 14 used a **sentinel error**, a package-level variable such as
`var ErrSoldOut = errors.New("sold out")` that callers test with `errors.Is`. A sentinel says
*which* condition happened, but carries no details. If seat C7 is taken, the caller may want the
seat, and cutting it out of the message text is fragile.

`error` is an interface with one method, `Error() string` (lesson 03), so any type with that
method is an error. A **custom error type** is usually a struct whose fields hold the details:

```go
// SeatError reports a seat that cannot be reserved.
type SeatError struct {
	Seat   string
	Reason string
}

func (e *SeatError) Error() string {
	return "seat " + e.Seat + ": " + e.Reason
}

var taken = map[string]bool{"C7": true}

func reserve(seat string) error {
	if taken[seat] {
		return &SeatError{Seat: seat, Reason: "already taken"}
	}
	taken[seat] = true
	return nil
}

func main() {
	err := reserve("C7")
	fmt.Println(err)
	if se, ok := err.(*SeatError); ok {
		fmt.Println("the caller can read the seat:", se.Seat)
	}
}
```

```text
seat C7: already taken
the caller can read the seat: C7
```

The conventions: name the type with an `Error` suffix and sentinels with an `Err` prefix. Give
`Error` a pointer receiver and return `&SeatError{...}`. Keep the result type `error`, not
`*SeatError`: lesson 03 showed that a nil `*SeatError` inside an `error` is not equal to nil.

## Wrapping builds a chain

Each layer of a program should add what it knows. `fmt.Errorf` with `%w` returns a new error that
includes the old message and remembers the old error: it has an `Unwrap() error` method that
returns it. Errors wrapping errors form the **error chain**:

```go
func bookFor(name, seat string) error {
	if err := reserve(seat); err != nil {
		return fmt.Errorf("booking for %s: %w", name, err)
	}
	return nil
}

// in main:
err := bookFor("Ada", "C7")
fmt.Println(err)
_, ok := err.(*SeatError)
fmt.Println("type assertion:", ok)
fmt.Println("unwrapped once:", errors.Unwrap(err))
```

```text
booking for Ada: seat C7: already taken
type assertion: false
unwrapped once: seat C7: already taken
```

The type assertion fails now: the outer value is the wrapper that `fmt.Errorf` made. `errors.Unwrap`
takes one step down the chain; the functions below walk all of it.

## Finding a type in the chain

`errors.Is(err, target)` searches the chain for a value equal to `target`: use it for sentinels.
To find a *type*, use `errors.As` or, since Go 1.26, the generic **`errors.AsType`**:

```go
if se, ok := errors.AsType[*SeatError](err); ok {
	fmt.Println("AsType found seat", se.Seat)
}

var se *SeatError
if errors.As(err, &se) {
	fmt.Println("As found seat", se.Seat)
}
```

```text
AsType found seat C7
As found seat C7
```

`errors.AsType[E](err)` returns the first error in the chain whose type is `E`, already
converted, and `true`; otherwise the zero value of `E` and `false`. The square brackets hold a
**type argument** (lesson 07 explains them). The older `errors.As` fills in a variable you pass
by pointer. `AsType` is checked by the compiler, keeps the variable inside the `if` and is faster;
the package documentation recommends it. You will still read `errors.As` in older code.

## Several errors at once

To report every problem with a form at once, `errors.Join` combines errors: it drops nil
arguments, returns nil when every argument is nil, and puts each message on its own line.
`fmt.Errorf` may also contain several `%w` verbs:

```go
func validate(name string, seats int) error {
	var errs []error
	if name == "" {
		errs = append(errs, ErrNoName)
	}
	if seats < 1 || seats > 6 {
		errs = append(errs, fmt.Errorf("seats: %d is not from 1 to 6", seats))
	}
	return errors.Join(errs...)
}

// in main:
err := validate("", 9)
fmt.Println(err)
fmt.Println("missing name?", errors.Is(err, ErrNoName))
fmt.Println("Unwrap of a joined error:", errors.Unwrap(err))

both := fmt.Errorf("swap seats: %w, %w", ErrSoldOut, ErrNoRefund)
fmt.Println(both)
fmt.Println(errors.Is(both, ErrSoldOut), errors.Is(both, ErrNoRefund))
```

```text
name is missing
seats: 9 is not from 1 to 6
missing name? true
Unwrap of a joined error: <nil>
swap seats: sold out, refunds closed
true true
```

Such errors have an `Unwrap() []error` method instead, so the chain is really a **tree**.
`errors.Is`, `As` and `AsType` search every branch; `errors.Unwrap` follows only the single-error
method and returns nil.

## Wrapping a pointer: the Go 1.27 vet check

When `Error` has a value receiver, the value type is the error type. A pointer to it is an error
too, since the method set of `*LimitError` includes the value methods (lesson 02). So this
compiles, and hides a bug:

```go
type LimitError struct{ Max int }

func (e LimitError) Error() string {
	return fmt.Sprintf("at most %d seats per booking", e.Max)
}

func order(seats int) error {
	if seats > 6 {
		return fmt.Errorf("order: %w", &LimitError{Max: 6})
	}
	return nil
}

// in main:
_, ok := errors.AsType[LimitError](order(9))
fmt.Println("found a LimitError:", ok)
```

```text
found a LimitError: false
```

The chain holds a `*LimitError`, so the search for `LimitError` fails. Since Go 1.27, `go vet`
reports it:

```text
main.go:17:29: %w wants operand of error type LimitError, not pointer type *LimitError (defeats errors.Is)
```

`go test` runs this check too, so the report stops a test build, including this course's labs.
Wrap `LimitError{Max: 6}`. Choose one receiver kind per error type and use it everywhere.

## Designing an error API

**Wrap to expose; don't wrap to hide.** `%w` makes the inner error part of your function's
promise: callers will test for it, so you must keep returning it. If it is an implementation
detail, such as your storage code's "row missing", format it with `%v`:
`fmt.Errorf("ticket %s: %v", ref, errRowMissing)`. The text is the same, but the chain stops
there, and `errors.Is(err, errRowMissing)` is false (practice 2 shows it). For each function,
decide what callers may rely on:

- **An opaque error**, just a message, when callers only need to know that it failed: the
  default.
- **A sentinel**, when callers must react to one condition. Wrap it with context rather than
  returning it bare, and document it.
- **A custom type**, when callers need details. Export the type and its fields.

Add context once per layer, saying what that layer was doing, so the message reads from the
outside in. Don't both log an error and return it: the code that handles it decides.

## Common mistakes

- **Comparing with `==` after wrapping.** `err == ErrSoldOut` is false once `err` is wrapped. Use
  `errors.Is`.
- **Passing `se` instead of `&se` to `errors.As`.** It panics with
  `errors: target must be a non-nil pointer`, and vet says `second argument to errors.As must be a
  non-nil pointer to either a type that implements error, or to any interface type`. Prefer
  `errors.AsType`.
- **Asking for the wrong type.** `errors.AsType[SeatError](err)` does not compile:
  `SeatError does not satisfy error (method Error has pointer receiver)`. Ask for `*SeatError`.
- **`%v` where you meant `%w`.** The message looks the same, but `errors.Is` returns false.

## Practice

1. Write `HeightError` with fields `Rider` and `CM` whose message is `Maya is 112 cm, minimum 120`,
   and `admit(rider string, cm int) error`. Wrap its error once more and read `CM` back with
   `errors.AsType`.
2. Wrap `ErrSoldOut` with `%v` and with `%w`, and print `errors.Is` for both.
3. Write `checkRide(rider string, cm int, ticket bool) error` that reports every problem at once.

### Answers

```go
func (e *HeightError) Error() string {
	return fmt.Sprintf("%s is %d cm, minimum 120", e.Rider, e.CM)
}

func admit(rider string, cm int) error {
	if cm < 120 {
		return &HeightError{Rider: rider, CM: cm}
	}
	return nil
}

func checkRide(rider string, cm int, ticket bool) error {
	var errs []error
	if err := admit(rider, cm); err != nil {
		errs = append(errs, err)
	}
	if !ticket {
		errs = append(errs, errors.New("no ticket"))
	}
	return errors.Join(errs...)
}

func main() {
	if err := admit("Maya", 112); err != nil {
		err = fmt.Errorf("big dipper: %w", err)
		if he, ok := errors.AsType[*HeightError](err); ok {
			fmt.Println(err, "| short by", 120-he.CM)
		}
	}
	hidden := fmt.Errorf("swap: %v", ErrSoldOut)
	kept := fmt.Errorf("swap: %w", ErrSoldOut)
	fmt.Println(errors.Is(hidden, ErrSoldOut), errors.Is(kept, ErrSoldOut))
	fmt.Println(checkRide("Maya", 112, false))
	fmt.Println(checkRide("Leo", 131, true) == nil)
}
```

```text
big dipper: Maya is 112 cm, minimum 120 | short by 8
false true
Maya is 112 cm, minimum 120
no ticket
true
```

## Key takeaways

- A custom error type is a struct with an `Error() string` method; return it as `error`.
- `%w` builds a chain; several `%w` or `errors.Join` build a tree. `errors.Is` finds a value,
  `errors.AsType[E]` (Go 1.26) a type.
- Since Go 1.27, vet reports `%w` applied to a `*E` when `E` itself is the error type.
- Wrapping is a promise: `%w` to expose, `%v` to hide; add context once per layer.

## Further reading

- [Package errors](https://pkg.go.dev/errors)
- [Go 1.26 release notes](https://go.dev/doc/go1.26)
- [Go 1.27 release notes](https://go.dev/doc/go1.27)
- [Go blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
