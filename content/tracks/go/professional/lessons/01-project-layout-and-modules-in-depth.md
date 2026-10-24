---
title: Project Layout and Modules in Depth
summary: Lay out a Go project that can grow, release module versions, and control exactly which dependency versions, tools and toolchain a build uses.
minutes: 35
objectives:
  - Choose between a single package, cmd/ and internal/, and explain what internal/ enforces
  - Release a module with version tags and move to a /v2 module path for a breaking change
  - Predict a build list with minimal version selection and inspect it with go mod graph, go list -m and go mod why
  - Use replace, exclude, workspaces, the toolchain line, tool directives, ignore, vendoring and GOPRIVATE where each fits
---

## Outline

1. Start small, then add cmd/ and internal/
2. Versions, tags and /v2
3. Minimal version selection
4. replace, exclude and workspaces
5. The go line, the toolchain line and GOTOOLCHAIN
6. Tools, ignored folders and vendoring
7. Private modules

## Start small, then add cmd/ and internal/

Medium lesson 01 showed that a package is a directory and a module is a tree of packages with a
`go.mod` at its root. The official advice on layout is to start with the least structure that
works: one package in the module root, all files `package main` for a small program. Split only
when the code asks for it.

When a module grows to several programs, or a program grows supporting packages, two folder
names do real work:

```text
tramstop/
  go.mod                  module example.com/tramstop
  cmd/
    departures/main.go    package main, one folder per binary
  internal/
    timetable/timetable.go
```

**`cmd/`** is only a convention: each subfolder is a `package main`, installed as
`go install example.com/tramstop/cmd/departures@latest`. **`internal/`** is enforced by the go
command: a package under `internal/` can be imported only by code rooted at the parent of
`internal`. Inside the module, `go run ./cmd/departures` works. Another module that tries the same
import is refused:

```text
package example.com/fanapp
	main.go:6:2: use of internal package example.com/tramstop/internal/timetable not allowed
```

That refusal is the point: you can rename or delete anything under `internal/` without breaking
anyone. A server, whose code nobody else imports, usually keeps everything in `internal/` and
its binaries in `cmd/`. Avoid a `pkg/` folder and deep trees made "for later": the official
layout guide never needs `pkg/`, and every extra folder is a longer import path with no benefit.

## Versions, tags and /v2

A module version is a git tag in **semantic versioning** form, `vMAJOR.MINOR.PATCH`: raise PATCH
for fixes, MINOR for compatible additions, MAJOR for breaking changes. Releasing is tagging:
`git tag v1.3.0` and `git push origin v1.3.0`. The module proxy then serves that version to
everyone, forever, so a published tag must never move; withdraw a bad release with a `retract`
line in a later version instead.

The **import compatibility rule** says that if two packages have the same import path, the newer
one must be backward compatible with the older one. So a breaking v2 needs a new path: the
`module` line becomes `module example.com/tramstop/v2`, every import inside the module gains
`/v2`, and you tag `v2.0.0`. v1 and v2 are then different modules, and one build can use both.
The Go blog describes two ways to lay this out: change the root module's path on the main
branch, or copy the code into a `v2/` folder with its own `go.mod`.

## Minimal version selection

Each `require` line is a **minimum**: "at least this version". To pick one version of each
module, the go command uses **minimal version selection** (MVS): walk the requirement graph from
the main module and keep, for every module path, the highest version anything requires. The
result is the **build list**. There is no lock file and no solver: the same `go.mod` files always
give the same build, and nothing upgrades until someone edits a `require`.

In this module, `fares v1.2.0` requires `geo v1.3.0` and `stops v1.2.0` requires `geo v1.4.0`.
After `go mod tidy`, the module's own requirements are (the sandbox has no network, so this
example's `go.mod` also has `replace` lines that point each version at a local folder):

```text
require (
	example.com/fares v1.2.0
	example.com/stops v1.2.0
)

require example.com/geo v1.4.0 // indirect
```

`go mod graph` prints every edge, one `module@version requirement@version` pair per line (the main
module has no version), and `go list -m` prints the build list:

```sh
go mod graph
go list -m -f '{{.Path}} {{.Version}}' all
go run .
```

```text
example.com/tramapp example.com/fares@v1.2.0
example.com/tramapp example.com/geo@v1.4.0
example.com/tramapp example.com/stops@v1.2.0
example.com/tramapp go@1.27
example.com/fares@v1.2.0 example.com/geo@v1.3.0
example.com/fares@v1.2.0 go@1.27
example.com/geo@v1.4.0 go@1.27
example.com/stops@v1.2.0 example.com/geo@v1.4.0
example.com/stops@v1.2.0 go@1.27
go@1.27 toolchain@go1.27
example.com/tramapp 
example.com/fares v1.2.0
example.com/geo v1.4.0
example.com/stops v1.2.0
fares v1.2.0 built with geo v1.4.0
stops v1.2.0 built with geo v1.4.0
```

`fares` asked for at least v1.3.0 and got v1.4.0, the lowest version that satisfies everyone.
The `go@` lines record each module's `go` line. Since `go 1.17`, `go.mod` lists every module
the build needs, direct or `// indirect`, so the go command can skip the requirements of
modules it does not need (**graph pruning**). `go mod why -m example.com/geo` prints the import
chain that needs a module (`example.com/tramapp`, `example.com/fares`, `example.com/geo`). For
modules at `go 1.27` or later, `go mod tidy` also merges duplicate `require` blocks into at
most two: direct and indirect.

## replace, exclude and workspaces

- **`replace`** swaps a module's source: `replace example.com/geo => ../geo` builds against your
  local checkout, and `replace example.com/geo v1.4.0 => example.com/fork/geo v1.4.1` uses a
  fork. A `replace` applies only in the main module's `go.mod`; the ones in your dependencies are
  ignored.
- **`exclude example.com/geo v1.4.0`** removes one version from the graph; the go command reports
  `go: ignoring requirement on excluded version example.com/geo v1.4.0` and needs a higher version
  instead. Also main module only.
- A **workspace** works on several modules at once without editing any `go.mod`:
  `go work init ./kiosk ./fares` writes a `go.work` with a `use` line for each folder, and builds
  inside it use your local `fares` instead of the published one. Do not commit `go.work`: it
  would make CI build against whatever folders happen to sit next to the module.

## The go line, the toolchain line and GOTOOLCHAIN

The `go` line is the minimum Go version the module needs; it also sets the language version the
compiler accepts. A `toolchain go1.27.3` line suggests a newer toolchain for working on this
module. **GOTOOLCHAIN** decides what happens when the line is newer than the installed Go: the
default `auto` downloads the required toolchain through the module proxy, and `local` refuses.
With a `go 1.28.0` line and `GOTOOLCHAIN=local`:

```text
go: go.mod requires go >= 1.28.0 (running go 1.27.3; GOTOOLCHAIN=local)
```

Raise the `go` line only when you need a newer language feature or library function, because
it raises the minimum for everyone who depends on you.

## Tools, ignored folders and vendoring

Since Go 1.24 a module can pin the tools its developers run. `go get -tool
example.com/stamp/cmd/stamp@v1.0.0` adds two lines to `go.mod`:

```text
tool example.com/stamp/cmd/stamp

require example.com/stamp v1.0.0 // indirect
```

```sh
go tool stamp
```

```text
stamp: build 42
```

The tool's version takes part in MVS like any other requirement, so the whole team runs the
same build of it. Since Go 1.25, `ignore ./node_modules` stops `./...` patterns from matching a
folder; without it, a stray `.go` file in that folder made `go build ./...` fail with a syntax
error. `go mod vendor` copies every needed package into `vendor/` with a `vendor/modules.txt`
list; when `vendor/` exists, builds use it by default, which suits builds without network access.

## Private modules

By default, `GOPROXY=https://proxy.golang.org,direct` fetches modules through Google's public
proxy and checks them against the checksum database `sum.golang.org`. A company module on a
private server must not go there: the proxy cannot fetch it, and its name would leak. Set
`GOPRIVATE=*.corp.example.com` (comma-separated globs) and the go command fetches matching
modules straight from version control and skips the checksum database for them. Credentials
come from git's own configuration, `.netrc` or `GOAUTH`.

## Common mistakes

- **Importing another module's internal package.** `use of internal package ... not allowed`.
  Ask the owner to export the API, or copy the code.
- **Tagging v2.0.0 without changing the module path.** A path without `/v2` can only have v0 and
  v1 versions, so users cannot require it: `require example.com/geo: version "v2.0.0" invalid:
  should be v0 or v1, not v2`. Change the `module` line and the imports, then tag.
- **Committing a `replace` to a local folder.** Everyone else's build fails with `reading
  ../geo/go.mod: open ...: no such file or directory`, because the folder exists only on your
  machine. Use a workspace locally instead.
- **Editing `go.mod` by hand and forgetting tidy.** Builds stop with `go: updates to go.mod
  needed; to update it: go mod tidy`. Run it and commit `go.mod` and `go.sum` together.

## Practice

1. `example.com/rota` requires `maps v1.1.0` and `clock v1.0.0`. `maps v1.1.0` requires
   `tz v1.2.0`; `clock v1.0.0` requires `maps v1.3.0` and `tz v1.5.0`. What is the build list?
2. Which command shows why `rota` needs `tz`, and what does it print?
3. Write the first line of `go.mod` for the breaking release of `example.com/tramstop`, and the
   import of its `timetable` package.

### Answers

1. The highest required version of each path wins: `maps` v1.3.0 (from `clock`), `tz` v1.5.0.
   After `go mod tidy`:

```sh
go list -m -f '{{.Path}} {{.Version}}' all
```

```text
example.com/rota 
example.com/clock v1.0.0
example.com/maps v1.3.0
example.com/tz v1.5.0
```

2. `go mod why -m example.com/tz` prints a shortest import chain:

```text
# example.com/tz
example.com/rota
example.com/clock
example.com/tz
```

3. `module example.com/tramstop/v2`, imported as
   `import "example.com/tramstop/v2/internal/timetable"` from inside that module.

## Key takeaways

- Start with one package; add `cmd/` for several binaries and `internal/` for code nobody else
  may import. Skip `pkg/`.
- Versions are semver tags; a breaking change needs a `/v2` module path.
- MVS picks the highest of the minimum versions required: deterministic, no lock file.
- `replace` and `exclude` work only in the main module; workspaces are for local work and stay
  out of git.
- The `tool` directive pins developer tools; `ignore` hides folders; `GOPRIVATE` keeps private
  modules away from the public proxy.

## Further reading

- [Go Modules Reference](https://go.dev/ref/mod)
- [Organizing a Go module](https://go.dev/doc/modules/layout)
- [Go Toolchains](https://go.dev/doc/toolchain)
- [Go Modules: v2 and Beyond](https://go.dev/blog/v2-go-modules)
