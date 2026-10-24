---
title: Defer, Panic and Recover
summary: Use defer for cleanup and to adjust results, see what a panic does to the stack, recover at a boundary, and know when to panic.
minutes: 35
objectives:
  - Predict the order and the argument values of deferred calls
  - Use defer to release resources and a deferred closure to change named results
  - Explain what a panic does, read a panic report, and recover inside a deferred function
  - Decide between an error and a panic, and write a Must function
---

## Outline

1. defer runs when the function returns
2. Cleanup with defer
3. Deferred closures can change results
4. What a panic does
5. recover turns a panic into an error
6. When to panic
7. os.Exit and re-panicking

## defer runs when the function returns

A **deferred call** (Basic lesson 09) is saved and run when the surrounding function returns.
Two rules decide what you see. Deferred calls run in **LIFO** order, last in, first out, like a
stack of plates. And the arguments are evaluated when the `defer` statement runs, not later:

```go
func main() {
	for i := range 3 {
		defer fmt.Println("deferred", i)
	}
	count := 1
	defer fmt.Println("count when deferred:", count)
	count = 10
	fmt.Println("main ends, count is", count)
}
```

```text
main ends, count is 10
count when deferred: 1
deferred 2
deferred 1
deferred 0
```

`count` was 1 when its `defer` ran, so the saved call prints 1. `defer` belongs to the function,
not to the block: the three calls from the loop wait until `main` returns.

## Cleanup with defer

What a function acquires, it must release on every path out: a file must be closed, a lock
unlocked. A release written before each `return` is forgotten when someone adds a new `return`.
Put a `defer` right after the acquisition succeeds instead:

```go
func countLines(name string) (int, error) {
	f, err := os.Open(name)
	if err != nil {
		return 0, err
	}
	defer f.Close() // runs on every return below

	n := 0
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		n++
	}
	return n, sc.Err()
}

func main() {
	fmt.Println(countLines("menu.txt"))
	fmt.Println(countLines("specials.txt"))
}
```

```text
3 <nil>
0 open specials.txt: no such file or directory
```

`os.Open` opens a file for reading, and lesson 11 covers files properly. Note the order: check the
error first, then defer. If `Open` failed, `f` is nil and there is nothing to close. The same
shape protects a lock (`mu.Lock()` then `defer mu.Unlock()`, Advanced lesson 04).

## Deferred closures can change results

A `return` statement first sets the result values, then the deferred calls run, then the
function hands the results to its caller. A deferred closure can therefore read and change
**named results**. A common use is adding context to every error a function returns, in one
place:

```go
func price(item string) (cents int, err error) {
	defer func() {
		if err != nil {
			err = fmt.Errorf("price of %q: %w", item, err)
		}
	}()
	p, ok := prices[item]
	if !ok {
		return 0, ErrUnknown
	}
	return p, nil
}
```

```text
250 <nil>
0 price of "fish": unknown item
```

The closure captures the variable `err` itself (Basic lesson 09), so it sees the value that
`return` set. Keep this for wrapping and recovery; ordinary logic reads better as a plain `return`.

## What a panic does

A **panic** stops the normal flow of a goroutine. The current function stops at once, its deferred
calls run, then its caller stops and runs its deferred calls, and so on up the stack. If nothing
stops it, the program prints the panic value and a **stack trace**, the list of calls that led
there, and exits with status 2:

```go
func main() {
	defer fmt.Println("deferred calls still run")
	scores := []int{7, 9}
	i := 2
	fmt.Println(scores[i])
}
```

```text
deferred calls still run
panic: runtime error: index out of range [2] with length 2

goroutine 1 [running]:
main.main()
	/work/main.go:9 +0xab
exit status 2
```

Read the first line for what happened and the first `main.` line of the trace for where. The Go
runtime causes a **run-time panic** for programming errors it cannot let pass. You have met
three others: writing to a nil map (`assignment to entry in nil map`), using a nil pointer
(`runtime error: invalid memory address or nil pointer dereference`), and a failed type assertion
without comma-ok (`interface conversion: interface {} is string, not int`). You can also call the
built-in `panic(value)` yourself, with any value.

## recover turns a panic into an error

The built-in `recover` stops a panic and returns its value. It only does that when it is called
**directly by a deferred function** while the goroutine is panicking; anywhere else it returns
nil. Together with a named result, it turns a panic into an ordinary error at a boundary:

```go
// share splits a bill; a panic inside becomes an ordinary error.
func share(cents, people int) (each int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("share %d between %d: %v", cents, people, r)
		}
	}()
	return cents / people, nil
}

func main() {
	fmt.Println(share(900, 3))
	fmt.Println(share(900, 0))
	fmt.Println("main carries on")
}
```

```text
300 <nil>
0 share 900 between 0: runtime error: integer divide by zero
main carries on
```

`recover` returns `any`. When the value is itself an error, test it with `r.(error)` and wrap it
with `%w` so callers can still use `errors.Is`. Recover at boundaries you own: a server's
handler for one request, a step in a batch job, the public functions of a package that panics
internally (`encoding/json` works this way). Don't recover everywhere: a panic that you swallow
hides a bug.

## When to panic

Return an error for anything that can go wrong in normal use: bad input, a missing file, a full
disk. Panic only for **programmer errors** and states that should be impossible, where carrying on
would do more harm. The standard library's **Must functions** follow this rule: `regexp.Compile`
returns an error, and `regexp.MustCompile` panics instead. It is meant for patterns written in
the source, typically in package-level variables, where a bad pattern is a bug in the program:

```go
var ticket = regexp.MustCompile(`^T-\d{3}$`)
var broken = regexp.MustCompile(`^T-(\d{3}$`)
```

```text
panic: regexp: Compile(`^T-(\d{3}$`): error parsing regexp: missing closing ): `^T-(\d{3}$`

goroutine 1 [running]:
regexp.MustCompile({0x51ffbb, 0xa})
	/usr/local/go/src/regexp/regexp.go:312 +0xe5
main.init()
	/work/main.go:9 +0x7e
exit status 2
```

The program fails at start-up, before `main`, the first time anyone runs it. Name your own
panicking helpers `mustX` the same way, and never use them for input from outside.

## os.Exit and re-panicking

`os.Exit` ends the program at once: deferred calls do **not** run. That is why Basic lesson 14
called it only from `main`, after printing the error:

```go
func main() {
	defer fmt.Println("never printed")
	fmt.Println("exiting")
	os.Exit(3)
}
```

```text
exiting
exit status 3
```

A deferred function may also recover, do some cleanup and then panic again with the same value,
because it cannot handle the problem after all. Since Go 1.25 the report says so in one line:

```text
closing the till after: assignment to entry in nil map
panic: assignment to entry in nil map [recovered, repanicked]
```

Older versions printed the value twice, once marked `[recovered]`.

## Common mistakes

- **Deferring before checking the error.** `f, err := os.Open(name); defer f.Close()` defers a
  call on a nil `*os.File` when `Open` fails. Check `err` first.
- **`defer` in a loop over many files.** Every file stays open until the function returns. Move
  the loop body into its own function so each `defer` runs per item.
- **Calling `recover` from a helper.** `defer func() { logPanic() }()` does not stop the panic,
  because `recover` inside `logPanic` is not called directly by the deferred function; the program
  still dies with `panic: boom 2`. Write `defer logPanic()`.
- **Panicking for ordinary failures.** A missing file or bad user input is an error, which the
  signature shows and callers can handle.

## Practice

1. What does `countdown` print? It defers `fmt.Print(i, " ")` for `i` in `range 3`, then prints
   `go `.
2. Write `double() (n int)` with a deferred closure so that `return 21` returns 42.
3. Write `safeIndex(xs []int, i int) (v int, err error)` that turns an index panic into an error.

### Answers

```go
func countdown() {
	for i := range 3 {
		defer fmt.Print(i, " ")
	}
	fmt.Print("go ")
}

func double() (n int) {
	defer func() { n *= 2 }()
	return 21
}

func safeIndex(xs []int, i int) (v int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("safeIndex: %v", r)
		}
	}()
	return xs[i], nil
}

func main() {
	countdown()
	fmt.Println()
	fmt.Println(double())
	fmt.Println(safeIndex([]int{4, 5, 6}, 1))
	fmt.Println(safeIndex([]int{4, 5, 6}, 5))
}
```

```text
go 2 1 0
42
5 <nil>
0 safeIndex: runtime error: index out of range [5] with length 3
```

## Key takeaways

- Deferred calls run when the function returns, last in first out, with arguments evaluated at
  the `defer`. Defer a release right after the acquisition succeeds.
- A deferred closure can change named results: use it to wrap errors or to recover.
- A panic unwinds the stack running deferred calls; `recover` stops it only when called directly
  by a deferred function.
- Errors for expected failures, panics for bugs; `os.Exit` skips deferred calls.

## Further reading

- [The Go Programming Language Specification: Defer statements](https://go.dev/ref/spec#Defer_statements)
- [The Go Programming Language Specification: Handling panics](https://go.dev/ref/spec#Handling_panics)
- [Effective Go: Defer, Panic and Recover](https://go.dev/doc/effective_go#defer)
- [Go blog: Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover)
