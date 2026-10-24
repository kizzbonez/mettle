---
title: Building and Shipping Go Programs
summary: Turn a module into release binaries and container images. Use go build's -o, -trimpath and -ldflags, stamp and read version information, cross-compile with GOOS and GOARCH, build static binaries with CGO_ENABLED=0, embed assets with go:embed, write build constraints, and package the result in a small multi-stage Docker image.
minutes: 40
objectives:
  - Build smaller, path-free binaries with -trimpath and -ldflags, and stamp a version with -X
  - Read a binary's version and build settings with runtime/debug.ReadBuildInfo and go version -m
  - Cross-compile for another GOOS and GOARCH and build a static binary with CGO_ENABLED=0
  - Embed files with //go:embed, select files with build constraints, and ship in a distroless image
---

## Outline

1. What go build makes
2. Stamping and reading the version
3. Smaller binaries without local paths
4. Cross-compiling and static binaries
5. Embedding files with go:embed
6. Build constraints
7. Container images
8. Releases you can reproduce

## What go build makes

`go build -o tally .` compiles the main package in the current directory and everything it
imports into one executable file, `tally`. The Go runtime and garbage collector are inside it;
the machine that runs it needs no Go installation and, in the usual case, no shared
libraries. Shipping a Go program is mostly shipping that one file, so the questions are which
file you build, for which machine, and how you tell later which version someone is running.

## Stamping and reading the version

A program should be able to say what it is. The linker flag `-X` sets a package-level string
variable at build time, and `runtime/debug.ReadBuildInfo` reads what the go command recorded:

```go
// version is set at build time with -ldflags "-X main.version=...".
var version = "dev"

func main() {
	fmt.Println("tally", version)
	info, ok := debug.ReadBuildInfo()
	if !ok {
		return
	}
	fmt.Println("module version:", info.Main.Version, "built with", info.GoVersion)
	for _, s := range info.Settings {
		if s.Key == "vcs.revision" || s.Key == "vcs.modified" {
			fmt.Printf("%s=%s\n", s.Key, s.Value)
		}
	}
}
```

Built in a Git repository whose last commit is tagged `v1.4.0`, first plainly, then with flags:

```sh
go build -o tally . && ./tally
go build -trimpath -ldflags="-s -w -X main.version=v1.4.0" -o tally-small . && ./tally-small
```

```text
tally dev
module version: v1.4.0 built with go1.27.3
vcs.revision=916b28d272eff9abf881678fcd8c103652c5b44b
vcs.modified=false
tally v1.4.0
module version: v1.4.0 built with go1.27.3
vcs.revision=916b28d272eff9abf881678fcd8c103652c5b44b
vcs.modified=false
```

Inside a repository, `go build` stamps the commit, its time and whether the tree had changes
(`vcs.modified`). Since Go 1.24 it also sets the main module's version from a tag on that
commit. The `-X` variable still matters, because many builds happen where there is no
repository: a Docker build that does not copy `.git`, for example. `-X` takes the full import
path of the package (`main` for the main package) and works only on string variables that are
not constants. `go version -m ./tally` prints the same information from any Go binary,
without running it, which is handy for checking what is deployed.

## Smaller binaries without local paths

The same two builds, listed with `ls -l`:

```text
2429834 tally
1560736 tally-small
```

`-ldflags="-s -w"` leaves out the symbol table and the DWARF debugging information, about a
third of the size here. Panics still print stack traces, but debuggers and some profilers lose
detail, so keep an unstripped build when you need them. `-trimpath` replaces absolute paths
such as `/home/ada/src/tally/main.go` in the binary with module paths. That keeps your machine's
directory layout out of the release and is one ingredient of a reproducible build.

## Cross-compiling and static binaries

The go command compiles for any supported platform from any other. Set **GOOS** (the operating
system) and **GOARCH** (the processor):

```sh
GOOS=windows GOARCH=arm64 go build -o tally.exe .
go version -m tally.exe | grep -E "GOOS|GOARCH"
```

```text
	build	GOARCH=arm64
	build	GOOS=windows
```

`go tool dist list` prints every pair. One thing does not cross over: **cgo**, Go's bridge to C
code, needs a C compiler for the target. When cgo is enabled, some standard packages (the DNS
resolver in `net`, `os/user`) link to the system's C library. A program that imports `net`,
checked with `ldd` after a plain build and after `CGO_ENABLED=0 go build -o static .`:

```text
	linux-vdso.so.1 (0x00007ffda5bec000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x0000755e50a89000)
	/lib64/ld-linux-x86-64.so.2 (0x0000755e50c82000)
	not a dynamic executable
```

With `CGO_ENABLED=0` the pure Go versions are used and the binary is fully **static**, so it
runs on any Linux of that architecture, including an image with no C library at all. Cross
builds switch cgo off by themselves. On amd64, `GOAMD64=v3` lets the compiler use newer
instructions (AVX2); the default `v1` runs on every x86-64 processor, so raise it only for
machines you control.

## Embedding files with go:embed

Templates, static web files and default configuration can travel inside the binary. A
`//go:embed` line above a package-level variable fills it at build time:

```go
//go:embed banner.txt
var banner string

//go:embed static
var static embed.FS
```

```text
Welcome to the ferry kiosk
. true
static true
static/index.html false
static/site.css false
"<h1>Timetable</h1>\n" <nil>
```

That is the program printing `banner`, walking `static` with `fs.WalkDir` and reading
`static/index.html`, after the files were deleted from disk. A `string` or `[]byte` holds one
file; an **`embed.FS`** holds a tree and is an `fs.FS` (Medium 11), so `http.FileServerFS`,
`template.ParseFS` and `fs.Sub` accept it. Patterns are relative to the package directory and
cannot use `..`; files starting with `.` or `_` are left out unless you write `all:static`. The
file must import `embed`, even only as `_ "embed"`.

## Build constraints

A **build constraint** decides whether a file is part of a build. A file name ending in
`_windows.go` or `_linux_arm64.go` is built only for that target; a `//go:build` line before
the package clause takes a boolean expression of build tags:

```go
//go:build !windows

package main

func configPath() string { return "/etc/kiosk/kiosk.conf" }
```

With a `config_windows.go` beside it, `go list -f "{{.GoFiles}}" .` shows which files a build
uses, on Linux and then with `GOOS=windows`:

```text
[config_other.go main.go]
[config_windows.go main.go]
```

Your own tags work the same way: a file with `//go:build integration` is built only by
`go test -tags integration`.

## Container images

A **multi-stage** Dockerfile builds in an image that has Go and copies only the binary into a
small final image. A **distroless** image holds little more than CA certificates and time zone
data; **scratch** is empty. Neither has a shell for an attacker to use.

```dockerfile
FROM golang:1.27 AS build
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY . .
ARG VERSION=dev
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/tally .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/tally /tally
ENTRYPOINT ["/tally"]
```

Copying `go.mod` and `go.sum` first lets Docker reuse the downloaded modules when only your
code changed. The `nonroot` image runs the program as an unprivileged user. (The sandbox has no
Docker, so this file is for your own machine.)

## Releases you can reproduce

A release is a SemVer tag such as `v1.4.0` on a commit (lesson 01), and binaries built from
it. The Go toolchain is designed so that the same source, Go version, flags and environment
give a bit-for-bit identical binary; `-trimpath` and a pinned `go` and `toolchain` line in
`go.mod` remove the usual differences. Publish a checksum file next to the binaries so users
can verify what they downloaded.

## Common mistakes

- **Building inside the repository.** An untracked output file makes the tree look changed, and
  the stamp says `module version: v1.4.0+dirty` and `vcs.modified=true`. Add build outputs to
  `.gitignore`.
- **A wrong `-X` name.** `-X main.Version=v1` (capital V) is ignored without a word, and the
  program still says `dev`. `-X version=v1` at least fails: `-X flag requires argument of the
  form importpath.name=value`. Use the exact package path and variable name.
- **Forgetting the import.** `//go:embed` without it fails with `go:embed requires import
  "embed" (or import _ "embed", if package is not used)`.
- **A static image with a cgo binary.** A binary linked to libc does not start in `scratch` or
  `distroless/static`. Build with `CGO_ENABLED=0`.

## Practice

1. Build a static binary for Linux on ARM64 and check what was recorded.
2. Embed every `.html` file in `templates/` and parse them as HTML templates.
3. How do you make a file part of macOS builds only?

### Answers

```sh
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o kiosk-arm64 .
go version -m kiosk-arm64 | grep -E "CGO_ENABLED|GOARCH|GOOS"
```

```go
//go:embed templates/*.html
var templateFiles embed.FS

var pages = template.Must(template.ParseFS(templateFiles, "templates/*.html"))
```

The build settings, then `pages.ExecuteTemplate(os.Stdout, "page", "Pier 3")`:

```text
	build	CGO_ENABLED=0
	build	GOARCH=arm64
	build	GOOS=linux
<h1>Timetable for Pier 3</h1>
```

3. Name it with the suffix `_darwin.go`, or put `//go:build darwin` above its package clause.

## Key takeaways

- `go build -trimpath -ldflags="-s -w -X main.version=..."` makes a smaller, path-free, versioned binary.
- `debug.ReadBuildInfo` and `go version -m` show the module version, Go version and VCS stamp.
- `GOOS` and `GOARCH` cross-compile; `CGO_ENABLED=0` gives a fully static binary.
- `//go:embed` puts files in the binary; `embed.FS` is an `fs.FS`.
- File suffixes and `//go:build` lines select files; ship in a multi-stage, distroless image.

## Further reading

- [Command go: compile packages and dependencies](https://pkg.go.dev/cmd/go#hdr-Compile_packages_and_dependencies)
- [Package embed](https://pkg.go.dev/embed)
- [Package runtime/debug: ReadBuildInfo](https://pkg.go.dev/runtime/debug#ReadBuildInfo)
- [Build Go images (Docker guide)](https://docs.docker.com/guides/golang/build-images/)
