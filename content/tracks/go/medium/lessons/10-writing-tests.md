---
title: Writing Tests
summary: Test Go code with go test and the testing package, from a first TestXxx function to table-driven subtests, helpers, examples, benchmarks with b.Loop and coverage.
minutes: 35
objectives:
  - Write TestXxx functions in _test.go files and choose between t.Errorf and t.Fatalf
  - Turn repeated checks into a table-driven test with named t.Run subtests, and run one with -run
  - Use t.Helper, t.Cleanup, t.TempDir and t.Context, and write an Example with an // Output comment
  - Measure a function with a b.Loop benchmark and read go test -cover and the vet checks go test runs
---

## Outline

1. go test and _test.go files
2. A first test
3. Errorf or Fatalf
4. Table-driven tests and subtests
5. Helpers, clean-up and temporary directories
6. Examples that are tested
7. Benchmarks with b.Loop
8. Coverage and the vet checks

## go test and _test.go files

A file whose name ends in `_test.go` is a **test file**: `go build` ignores it, and `go test` compiles it together with the package and runs every function of the form `func TestXxx(t *testing.T)`, where `Xxx` does not start with a lower-case letter. No framework is needed; the `testing` package and the `go` command are all there is.

Here is the code under test, `fee.go` in the module `example.com/library`:

```go
// Package library works out what a library charges.
package library

// LateFee returns the fee in cents for a book returned daysLate days late:
// 20 cents a day, never more than 500.
func LateFee(daysLate int) int {
	if daysLate <= 0 {
		return 0
	}
	return min(daysLate*20, 500)
}
```

## A first test

The test sits next to it in `fee_test.go`, in the same package, so it can see unexported names too:

```go
package library

import "testing"

func TestLateFee(t *testing.T) {
	got := LateFee(3)
	if got != 60 {
		t.Errorf("LateFee(3) = %d, want 60", got)
	}
}
```

Go has no `assert`: compare with `if` and report through `t`. The message follows the Go convention **got, then want**, naming the call, so a failure explains itself. Run `go test` in the package folder: it prints `ok  example.com/library 0.005s`, and `-v` would list each test by name. Now break the code (`(daysLate-1)*20`) and run `go test` again:

```text
--- FAIL: TestLateFee (0.00s)
    fee_test.go:8: LateFee(3) = 40, want 60
FAIL
exit status 1
FAIL	example.com/library	0.005s
```

A test you have never seen fail may test nothing, so make it fail once on purpose.

## Errorf or Fatalf

`t.Errorf` marks the test as failed and **keeps going**, so one run reports every wrong value. `t.Fatalf` marks it failed and **stops this test** at once. Use `Fatalf` when the rest cannot run, such as a set-up step that failed:

```go
func TestFromFixture(t *testing.T) {
	days, err := strconv.Atoi("3x")
	if err != nil {
		t.Fatalf("reading days: %v", err)
	}
	if got := LateFee(days); got != 60 {
		t.Errorf("LateFee(%d) = %d, want 60", days, got)
	}
}
```

```text
--- FAIL: TestFromFixture (0.00s)
    fee_test.go:11: reading days: strconv.Atoi: parsing "3x": invalid syntax
```

The fee check never runs, which is right: without `days` it could only add noise. Call `Fatalf` only from the test's own goroutine (Advanced 01 introduces goroutines).

## Table-driven tests and subtests

Five checks written out are five copies of one `if`. The idiomatic form is a **table-driven test**: a slice of anonymous structs, one per case, and one loop. `t.Run` runs each case as a **subtest** with its own name and its own pass or fail:

```go
func TestLateFee(t *testing.T) {
	tests := []struct {
		name string
		days int
		want int
	}{
		{"on time", 0, 0},
		{"returned early", -2, 0},
		{"one day", 1, 20},
		{"just under the cap", 24, 480},
		{"capped", 40, 500},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := LateFee(tt.days); got != tt.want {
				t.Errorf("LateFee(%d) = %d, want %d", tt.days, got, tt.want)
			}
		})
	}
}
```

Run against the broken `LateFee`, `go test` names each failing subtest, with spaces turned into underscores:

```text
--- FAIL: TestLateFee (0.00s)
    --- FAIL: TestLateFee/one_day (0.00s)
        fee_test.go:20: LateFee(1) = 0, want 20
    --- FAIL: TestLateFee/just_under_the_cap (0.00s)
        fee_test.go:20: LateFee(24) = 460, want 480
FAIL
```

Both charged results are 20 cents short while the cap still works: an off-by-one, found without reading the code. Good tables sit on the **boundaries**: zero, a negative value, the first charged day, the day before the cap, the cap itself.

`-run` takes a regular expression, split at `/` into one part per level, so `go test -v -run 'TestLateFee/one'` runs only `TestLateFee/one_day` (and its parent). The closure can use `tt` safely: since Go 1.22 every loop iteration has its own variable.

## Helpers, clean-up and temporary directories

A check you repeat can move into a **helper** that takes the `*testing.T`. Calling `t.Helper()` first makes failures report the caller's line instead of the helper's:

```go
func checkFee(t *testing.T, days, want int) {
	t.Helper()
	if got := LateFee(days); got != want {
		t.Errorf("LateFee(%d) = %d, want %d", days, got, want)
	}
}
```

With it, a failure reports the calling line in the test (`fee_test.go:18`); without it, every failure reports line 12 inside the helper.

Three more methods handle set-up and tear-down:

```go
func TestSetUp(t *testing.T) {
	ctx := t.Context()
	dir := t.TempDir()
	t.Cleanup(func() { t.Log("registered first, runs last") })
	t.Cleanup(func() { t.Log("registered second, runs first; context:", ctx.Err()) })
	t.Log("working in a fresh directory:", dir != "", "context:", ctx.Err())
}
```

```text
=== RUN   TestSetUp
    fee_test.go:10: working in a fresh directory: true context: <nil>
    fee_test.go:9: registered second, runs first; context: context canceled
    fee_test.go:8: registered first, runs last
--- PASS: TestSetUp (0.01s)
```

- `t.Cleanup(f)` runs `f` when the test ends, last registered first, even after `Fatalf`.
- `t.TempDir()` returns a new empty directory that is deleted after the test (lesson 11 writes files).
- `t.Context()` (Go 1.24) returns a **context** that is cancelled just before the clean-ups run; Advanced 05 explains contexts.

Files a test reads belong in a folder named `testdata`: the `go` tool ignores it as a package, and tests run with the package folder as their working directory, so `testdata/loans.csv` just works.

## Examples that are tested

An **example function** is documentation that `go test` runs: `ExampleLateFee` prints, and its `// Output:` comment says what it must print. Examples usually live in the **external test package** `library_test`, which sees only exported names, as a user would:

```go
package library_test

import (
	"fmt"

	"example.com/library"
)

func ExampleLateFee() {
	fmt.Println(library.LateFee(3))
	// Output: 30
}
```

```text
--- FAIL: ExampleLateFee (0.00s)
got:
60
want:
30
```

Fix the comment to `// Output: 60` and it passes. `go doc` and pkg.go.dev show examples next to the function, and because they are run they cannot go stale.

## Benchmarks with b.Loop

A **benchmark** is `func BenchmarkXxx(b *testing.B)`. Since Go 1.24, the body loops with `b.Loop()`, which times the loop and stops the compiler from optimising the call away:

```go
func BenchmarkLateFee(b *testing.B) {
	for b.Loop() {
		library.LateFee(12)
	}
}
```

`go test -bench . -run '^$'` runs benchmarks and no tests:

```text
BenchmarkLateFee-2   	1000000000	         0.9897 ns/op
```

The `-2` is GOMAXPROCS; then come the iterations and the time per call. Benchmarks measure instead of guessing; Professional 07 covers performance.

## Coverage and the vet checks

`go test -cover` reports how much of the package the tests ran. With only `LateFee(3)` tested:

```text
PASS
coverage: 66.7% of statements
ok  	example.com/library	0.008s
```

The `return 0` branch never ran. Coverage finds untested code; it cannot tell you the tests check the right answers.

`go test` also runs a subset of `go vet` (printf, stdversion and others) first, and refuses to run when one fails. A `%s` for an `int` in a test:

```text
./fee_test.go:8:26: (*testing.common).Errorf format %s has arg got of wrong type int
FAIL	example.com/library [build failed]
```

## Common mistakes

- **Misnaming the test.** `func testLateFee` is skipped without a word (`testing: warning: no tests to run` if it was the only one). `func Testlatefee` stops the build: `Testlatefee has malformed name: first letter after 'Test' must not be lowercase`. Write `TestLateFee`.
- **Using `Fatalf` for every check.** The first failure hides the others. Use `Errorf` unless the rest cannot run.
- **Messages without values.** `t.Error("wrong fee")` makes you rerun with prints. Write `LateFee(%d) = %d, want %d`.
- **Computing `want` with the code under test.** `want := LateFee(3)` always passes. Work out expected values by hand from the rules.

## Practice

1. Add a case to the table for exactly 25 days. What is its subtest name in `-v` output?
2. Which command runs only the `capped` subtest?
3. Write `ExampleLateFee_onTime` showing that a book returned on time costs nothing.

### Answers

1. Add `{"at the cap", 25, 500},` to `tests`; it runs as `TestLateFee/at_the_cap`.
2. `go test -v -run 'TestLateFee/capped'`.
3. A suffix after `_` that starts with a lower-case letter names a second example of the same function:

```go
func ExampleLateFee_onTime() {
	fmt.Println(library.LateFee(0))
	// Output: 0
}
```

`go test -v -run 'TestLateFee/at|Example'` checks answers 1 and 3:

```text
=== RUN   TestLateFee
=== RUN   TestLateFee/at_the_cap
--- PASS: TestLateFee (0.00s)
    --- PASS: TestLateFee/at_the_cap (0.00s)
=== RUN   ExampleLateFee_onTime
--- PASS: ExampleLateFee_onTime (0.00s)
PASS
```

## Key takeaways

- Tests are `func TestXxx(t *testing.T)` in `_test.go` files, run by `go test`.
- Report `got, want` with `t.Errorf`; use `t.Fatalf` only when the test cannot go on.
- Table-driven tests with named `t.Run` subtests are the idiom; put cases on the boundaries.
- `t.Helper`, `t.Cleanup`, `t.TempDir` and `t.Context` keep tests tidy; fixtures go in `testdata`.
- Examples are tested documentation, `b.Loop` benchmarks measure, `-cover` finds untested code, and vet runs first.

## Further reading

- [Package testing](https://pkg.go.dev/testing)
- [go command: Test packages](https://pkg.go.dev/cmd/go#hdr-Test_packages)
- [Go Wiki: Table-driven tests](https://go.dev/wiki/TableDrivenTests)
- [Go by Example: Testing and Benchmarking](https://gobyexample.com/testing-and-benchmarking)
