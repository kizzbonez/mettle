---
title: Static Analysis and Code Quality
summary: Keep a Go codebase healthy with tools and habits. Format with gofmt and goimports, catch bugs with go vet and its analyzers, modernise code with go fix and migrate APIs with //go:fix inline, add staticcheck or golangci-lint, follow Go's naming, error and documentation conventions, and run it all in CI.
minutes: 35
objectives:
  - Run go vet, read its reports and name the checks that go test runs on every build
  - Use go fix -diff to apply modernizers, and mark a deprecated function with //go:fix inline
  - Apply Go's conventions for names, initialisms, error strings and doc comments in review
  - Put formatting, vet, linters, tests and govulncheck into one CI check
---

## Outline

1. Let machines check the mechanical things
2. gofmt and goimports
3. go vet
4. go fix and the modernizers
5. //go:fix inline for your own API changes
6. staticcheck and golangci-lint
7. What tools cannot check: names, errors, docs
8. Code review and CI

## Let machines check the mechanical things

A reviewer's attention is limited. Spent on brace positions and a forgotten `%d`, it is not
spent on the design, the error handling or the test that is missing. Go's culture leans on
tools for everything a program can decide: one formatter that nobody configures, a vet tool
that ships with the compiler, and linters run in CI. Code reaches a human only after the
machines are satisfied, so review is about what only a human can judge.

## gofmt and goimports

`gofmt -l .` lists files that are not formatted and `gofmt -w .` rewrites them; `go fmt ./...`
runs it on packages. **goimports** (`golang.org/x/tools/cmd/goimports`) formats too, and also
adds missing imports and removes unused ones; most editors run it, or gopls, on save. There is
nothing to discuss about Go formatting, which is the point: every Go file looks the same.

## go vet

**go vet** runs **analyzers**: checks for code that compiles but is almost certainly wrong.

```go
func (c Counter) Value() int { // Counter has a sync.Mutex field
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

func dial(host string, port int) (net.Conn, error) {
	return net.Dial("tcp", fmt.Sprintf("%s:%d", host, port))
}

func main() {
	var c Counter
	fmt.Printf("%d visitors on %s\n", c.Value())
	var wg sync.WaitGroup
	for range 3 {
		go func() {
			wg.Add(1)
			defer wg.Done()
		}()
	}
	wg.Wait()
	_, _ = dial("localhost", 80)
}
```

```text
main.go:14:9: Value passes lock by value: example.Counter contains sync.Mutex
main.go:21:37: address format "%s:%d" does not work with IPv6
main.go:26:29: fmt.Printf format %s reads arg #2, but call has 1 arg
main.go:30:10: WaitGroup.Add called from inside new goroutine
```

Four real bugs. **copylocks**: a value receiver copies the mutex, so it locks nothing (Advanced
04). **hostport** (Go 1.25): use `net.JoinHostPort`, which brackets IPv6 addresses. **printf**:
a verb without an argument. **waitgroup** (Go 1.25): `Add` inside the goroutine may run after
`Wait`; call it before `go`, or use `wg.Go`. **loopclosure** has a history: before Go 1.22 it
caught goroutines and defers sharing one loop variable; with per-iteration variables (Go 1.22)
that bug cannot happen, so it matters only for code whose `go` version is older.

`go test` runs a high-confidence subset on every build: atomic, bools, buildtag, directive,
errorsas, ifaceassert, nilfunc, printf, stdversion, stringintconv and tests. **stdversion**
joined in Go 1.27. In a module whose `go.mod` says `go 1.24`, using Go 1.27's `strings.CutLast`
still builds with a new toolchain, but `go test` stops:

```text
./berth.go:7:25: strings.CutLast requires go1.27 or later (module is go1.24)
```

Users on Go 1.24 could not build that code, so raise the `go` line or avoid the function. Run
the full set with `go vet ./...`.

## go fix and the modernizers

Go 1.26 rebuilt **go fix** on the same analysis framework as vet. Its analyzers, the
**modernizers**, rewrite code to newer idioms without changing what it does. `go fix -diff
./...` shows the changes; `go fix ./...` applies them. On older-style code:

```text
-func describe(v interface{}) string {
+func describe(v any) string {
 	return fmt.Sprint(v)
 }
 
 func contains(names []string, want string) bool {
-	for _, n := range names {
-		if n == want {
-			return true
-		}
-	}
-	return false
+	return slices.Contains(names, want)
 }
 
 func main() {
-	for i := 0; i < 3; i++ {
+	for i := range 3 {
```

(The diff also added the `slices` import and replaced a `strings.Index` and two slices with
`strings.Cut`.) `go tool fix help` lists the analyzers: `any`, `rangeint`, `slicescontains`,
`stringscut`, `minmax`, `newexpr` for Go 1.26's `new(expr)`, and more. Go 1.27 added
`atomictypes`, `embedlit`, `slicesbackward` and `unsafefuncs`, and renamed `waitgroup` to
`waitgroupgo` (it rewrites `wg.Add(1)` plus `go` plus `Done` into `wg.Go`). Run it after each
toolchain upgrade, on a clean working tree, so the commit holds nothing but its changes.

## //go:fix inline for your own API changes

When you rename a function in a library, the old name must stay for compatibility. Make it
a one-line wrapper, mark it deprecated, and add `//go:fix inline`:

```go
// Metres converts a reading in centimetres to metres.
//
// Deprecated: use [FromCentimetres], which says what it converts from.
//
//go:fix inline
func Metres(cm int) float64 {
	return FromCentimetres(cm)
}
```

`go fix -diff ./...` in a module that calls it:

```text
 func main() {
-	fmt.Println(tides.Metres(945))
+	fmt.Println(tides.FromCentimetres(945))
 }
```

`go fix` replaced the call with the function's body, so users migrate by running one command.
The `Deprecated:` paragraph is a convention that `go doc`, gopls and linters understand.

## staticcheck and golangci-lint

vet is deliberately cautious. **staticcheck** (`honnef.co/go/tools/cmd/staticcheck`) adds
hundreds of checks in families: SA for probable bugs (an ignored `append` result, a deferred
`Close` before the error check), S for simplifications, ST for style (ST1005: error string
format), QF for quick fixes. **golangci-lint** runs many linters, staticcheck, errcheck,
gosec and others, from one `.golangci.yml`. Neither is in this sandbox; add one with
`go get -tool` (lesson 01) so the whole team runs the same version via `go tool`.

## What tools cannot check: names, errors, docs

Effective Go and the Go Code Review Comments wiki describe the conventions reviewers enforce:

- **Names**: MixedCaps; short names for short scopes; initialisms in one case (`userID`,
  `ServeHTTP`, `parseURL`, never `parseUrl`); no `Get` on getters (`Owner()`); no stutter
  (`tides.Reading`, not `tides.TidesReading`); package names short and lower-case, never
  `util` or `common`.
- **Errors**: strings lower-case without final punctuation (`fmt.Errorf("read tide table: %w",
  err)`), because they get wrapped mid-sentence; sentinels `ErrX`, types `XError`; handle or
  return every error, never `_` it.
- **Docs**: every exported name has a comment that is a full sentence starting with the name;
  each package has one `// Package tides ...` comment. That is what `go doc` and pkg.go.dev show.

## Code review and CI

Keep changes small enough to review in one sitting, describe why in the description, and
review the tests as carefully as the code. Make CI run what a reviewer should never have to:

```sh
test -z "$(gofmt -l .)"   # fails when a file is not formatted
go vet ./...
go tool staticcheck ./...
go test -race ./...
go tool govulncheck ./...
```

## Common mistakes

- **Silencing vet instead of fixing.** Its reports are rarely false; a `copylocks` report is a
  real bug.
- **Mixing `go fix` with other work.** A modernizer commit should hold only its rewrite.
- **`Println` with a format.** vet says `fmt.Println call has possible Printf formatting
  directive %d`; use `Printf`.
- **Too-new APIs.** stdversion fails `go test` when code needs a newer Go than `go.mod` claims.

## Practice

1. What does vet report for `fmt.Println("total: %d", n)`?
2. Fix the names: `func GetUrl()`, `type TidesReading` in package `tides`, and
   `errors.New("Reading failed.")`.
3. Show that the CI line `test -z "$(gofmt -l .)"` fails for a badly formatted `extra.go`.

### Answers

1. Run `go vet .`:

```text
main.go:7:2: fmt.Println call has possible Printf formatting directive %d
```

2. `func URL()` (no `Get`, initialism in one case), `type Reading` (callers write
   `tides.Reading`), and `errors.New("reading failed")`.

3. With `func helper( ) {}` in `extra.go`:

```sh
gofmt -l .
test -z "$(gofmt -l .)" && echo formatted || echo "not formatted"
```

```text
extra.go
not formatted
```

## Key takeaways

- gofmt or goimports on save; nothing to configure, nothing to debate.
- go vet finds compiling bugs; go test runs its safe subset, stdversion included since 1.27.
- `go fix -diff` previews modernizers; `//go:fix inline` migrates callers of a deprecated API.
- staticcheck or golangci-lint, pinned with `go get -tool`, go beyond vet.
- Review names, errors, docs and design; let CI check everything mechanical.

## Further reading

- [Command vet](https://pkg.go.dev/cmd/vet)
- [Using go fix to modernize Go code (Go blog)](https://go.dev/blog/gofix)
- [//go:fix inline and the source-level inliner (Go blog)](https://go.dev/blog/inliner)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
