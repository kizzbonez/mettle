---
title: Packages, Modules and Visibility
summary: Split a program into packages inside a module, control what other packages can see with a capital letter, manage dependencies with go.mod, go.sum and go mod tidy, and document a package so that go doc can show it.
minutes: 35
objectives:
  - Lay out a module with a main package and a library package, and import one from the other by its import path
  - Decide which names to export, and read the compiler errors for unexported names and internal packages
  - Explain the lines of go.mod and go.sum, and add or remove a dependency with go mod tidy and go get
  - Write doc comments that go doc displays, and keep package initialisation explicit instead of hiding it in init
---

## Outline

1. Packages and import paths
2. Exported and unexported names
3. internal directories
4. go.mod, dependencies and go.sum
5. Naming a package
6. Package initialisation
7. Doc comments and go doc

## Packages and import paths

A **package** is a directory of `.go` files that all start with the same package clause. They
are compiled together and share every name without importing each other. `package main` builds
a program and must declare `func main`; any other name makes a **library package**, code for
other packages to import.

A **module** is a tree of packages that are versioned and released together, rooted at the
directory that holds `go.mod`. Here is a small one:

```text
harbour/
├── go.mod          module example.com/harbour
├── main.go         package main
└── fares/
    └── fares.go    package fares
```

```go
// Package fares prices tickets for the harbour ferry.
package fares

// Adult is the price of one adult ticket, in pence.
const Adult = 450

// Price returns what n adult tickets cost, in pence.
// Every tenth ticket in one purchase is free.
func Price(n int) int {
	return (n - free(n)) * Adult
}

// free returns how many of n tickets are free.
func free(n int) int {
	return n / 10
}
```

```go
package main

import (
	"fmt"

	"example.com/harbour/fares"
)

func main() {
	fmt.Println(fares.Adult, fares.Price(3), fares.Price(12))
}
```

```text
450 1350 4950
```

A package's **import path** is the module path from `go.mod` followed by the package's directory
inside the module: `example.com/harbour` plus `fares`. Standard packages such as `"fmt"` have
short paths without a dot. By convention the last element of the path is the package name, and
you use what the package offers as `fares.Price`. `go build ./...` builds every package in the
module.

## Exported and unexported names

A name is **exported**, usable by other packages, when it starts with an upper-case letter and is
declared at package level, or is a struct field or a method. Everything else is **unexported**:
private to its package. There is no `public` keyword; the first letter decides. Calling
`fares.free(12)` from `main` stops the build:

```text
./main.go:10:49: name free not exported by package fares
```

Struct fields follow the same rule. With `type Ticket struct { Name string; code int }` in
`fares`, `main` may use `Name` but not `code`. `t := fares.Ticket{Name: "Ada", code: 7}` and
then `fmt.Println(t.code)` give:

```text
./main.go:10:33: cannot refer to unexported field code in struct literal of type fares.Ticket
./main.go:11:16: t.code undefined (cannot refer to unexported field code)
```

Export as little as you can: every exported name is a promise to the code that uses it. An
unexported helper like `free` can be renamed or deleted at any time, and an unexported field can
be changed only by its own package, so it never holds a value the package did not intend.

## internal directories

A package below a directory named `internal` can be imported only by code in the tree rooted at
the parent of `internal`. So `fares/internal/round` may be used by `fares` and the packages
below it, but not by `main`:

```text
package example.com/harbour
	main.go:7:2: use of internal package example.com/harbour/fares/internal/round not allowed
```

## go.mod, dependencies and go.sum

`go mod init example.com/harbour` wrote the first lines of this go.mod:

```text
module example.com/harbour

go 1.27.3

require github.com/google/go-cmp v0.7.0
```

- `module` is the module path, the prefix of every import path in it. For published code it is
  also where the code is downloaded from, such as a GitHub repository.
- `go` is the minimum Go version the module needs, enforced since Go 1.21; `go mod init` writes
  the version you ran it with. An optional `toolchain` line names a toolchain to prefer;
  Professional 01 covers both.
- `require` gives each dependency's minimum version. A `// indirect` comment marks a module
  that none of your packages imports directly.

To add a dependency, import its package in your code and run `go mod tidy`:

```text
go: finding module for package github.com/google/go-cmp/cmp
go: downloading github.com/google/go-cmp v0.7.0
go: found github.com/google/go-cmp/cmp in github.com/google/go-cmp v0.7.0
```

`go mod tidy` adds what your imports need and removes what nothing imports any more. `go get
github.com/google/go-cmp@v0.7.0` asks for one version; `@none` removes the module.

Versions follow **semantic versioning**: in `v1.4.2`, 1 is the major version, and a new major
version means incompatible changes. From v2 on, the major version is part of the module path
(`example.com/mod/v2`), so v1 and v2 are different modules: **semantic import versioning**.

The download also writes `go.sum`:

```text
github.com/google/go-cmp v0.7.0 h1:wk8382ETsv4JYUZwIsn6YpYiWiBsYLSJiTsyBybVuN8=
github.com/google/go-cmp v0.7.0/go.mod h1:pXiqmnSA92OHEEa9HXL2W4E7lf9JzCmGVUdgjX3N/iU=
```

Each line is a SHA-256 hash (`h1:`) of the module's files, or of its `go.mod` alone. The go
command checks each new hash of a public module against the **checksum database** at
sum.golang.org, a public log of every published version's hash. If anyone later serves different code under the same
version, the hashes differ and the build stops. Commit both files.

## Naming a package

Package names are short, lower case and one word, such as `fares` or `strconv`. Callers write
the name in front of everything, so do not repeat it: `fares.Price`, not `fares.FarePrice`, just
as the standard library has `bufio.Reader`, not `bufio.BufReader`. Avoid `util`, `common` and
`helpers`: they say nothing about their contents and grow into piles of unrelated code.

## Package initialisation

Before `main` runs, every package is initialised once, imported packages first. Package-level
variables get their values in dependency order, not declaration order, and then each
`func init()` runs:

```go
package main

import "fmt"

var total = price * count
var price = 450
var count = startCount()

func startCount() int {
	fmt.Println("setting count")
	return 3
}

func init() {
	fmt.Println("init sees total", total)
}

func main() {
	fmt.Println("main starts")
}
```

```text
setting count
init sees total 1350
main starts
```

`total` is declared first but set last, because it needs the other two. A package may have
several `init` functions, and no code can call them. Use `init` rarely: it runs whenever the
package is imported, tests included, it cannot return an error, and nothing in `main` shows that
it ran. A variable set in its own declaration, or a function that `main` calls, does the same
work in plain sight.

## Doc comments and go doc

A **doc comment** is a comment directly above a package clause or a top-level declaration, with
no blank line in between. Every exported name should have one: a complete sentence that starts
with the name. The package comment starts with `Package fares`. `go doc` prints them, for exported
names only:

```sh
go doc ./fares
```

```text
package fares // import "example.com/harbour/fares"

Package fares prices tickets for the harbour ferry.

const Adult = 450
func Price(n int) int
```

`go doc ./fares Price` shows one name with its comment, and `go doc strings.Cut` works for any
standard package. Since Go 1.27, `go doc github.com/google/go-cmp/cmp@v0.7.0` reads a version
that is not in your go.mod, and `go doc -ex strings` lists a package's runnable examples. The same
comments make the pages of pkg.go.dev, the site for every public Go package. Its index of the
standard library, pkg.go.dev/std, is the tour to take: about 180 packages, from `strings` to
`net/http`.

## Common mistakes

- **Leaving out the module path.** `import "fares"` fails with `package fares is not in std
  (/usr/local/go/src/fares)`. Write `"example.com/harbour/fares"`.
- **Two package names in one directory.** `found packages tickets (child.go) and fares
  (fares.go) in /work/fares`. Every file in a directory declares the same package.
- **A blank line under a doc comment.** The comment is then not attached, and `go doc ./fares
  Price` shows the signature alone.

## Practice

1. Add `fares/child.go` with an exported constant `Child` of 225. Does it need to import
   `fares`?
2. In the same file, write and document `Refund(p int) int`, which returns 90 percent of `p`
   rounded down. Print `fares.Child` and `fares.Refund(455)` from `main`, then run `go doc
   ./fares Refund`.
3. Declared in `fares`, which of these can `main` use: `Price`, `price`, `ÉtéRate`, `_Total`,
   the field `Ticket.code`?

### Answers

**1.** No: the files of one package share their names without any import.

**2.** `fares/child.go`:

```go
package fares

// Child is the price of one child ticket, in pence.
const Child = 225

// Refund returns the refund on a ticket that cost p pence:
// 90 percent of p, rounded down to a whole penny.
func Refund(p int) int {
	return p * 9 / 10
}
```

```text
225 409
package fares // import "example.com/harbour/fares"

func Refund(p int) int
    Refund returns the refund on a ticket that cost p pence: 90 percent of p,
    rounded down to a whole penny.
```

**3.** `Price` and `ÉtéRate` (`É` is an upper-case letter). `price`, `_Total` and `code` do not
start with an upper-case letter, so they are unexported.

## Key takeaways

- A package is one directory; its import path is the module path plus that directory.
- An upper-case first letter exports a name. Export little.
- `go.mod` names the module, the minimum Go version and the dependencies; `go.sum` holds their
  hashes, checked against sum.golang.org. `go mod tidy` keeps both right.
- Name packages short and specific, never `util`; prefer plain declarations to `init`.
- Doc comments are sentences that start with the name; `go doc` and pkg.go.dev show them.

## Further reading

- [How to Write Go Code](https://go.dev/doc/code)
- [Go Modules Reference](https://go.dev/ref/mod)
- [Go Doc Comments](https://go.dev/doc/comment)
- [The Go Blog: Package names](https://go.dev/blog/package-names)
