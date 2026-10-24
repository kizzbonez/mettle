---
title: Installing Go and a First Program
summary: Install Go 1.27, start a module with go mod init, write, run and build a first program, keep it formatted with gofmt and checked with go vet, and read a compiler error by its file, line and column.
minutes: 30
objectives:
  - Install Go and check the installation with go version and go env
  - Create a module with go mod init and explain both lines of its go.mod
  - Run a program with go run, build it with go build and run the binary
  - Format code with gofmt, check it with go vet, and read a compiler error by file, line and column
---

## Outline

1. Installing Go
2. A module and its go.mod
3. The first program
4. go run and go build
5. Formatting with gofmt
6. Checking with go vet
7. Reading a compiler error
8. Comments, the Playground and your editor

## Installing Go

Download Go from [go.dev/dl](https://go.dev/dl/) and pick the file for your system:

- **Windows**: the `.msi` installer. It installs Go under Program Files and adds it to your `PATH`,
  the list of folders a terminal searches for commands. Open a *new* terminal afterwards.
- **macOS**: the `.pkg` installer. It installs Go into `/usr/local/go` and adds
  `/usr/local/go/bin` to your `PATH`.
- **Linux**: the `.tar.gz` archive. Unpack it into `/usr/local` and add Go to your `PATH` (put the
  second line in `~/.profile` to keep it):

```sh
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.27.3.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

Then check that the terminal finds Go:

```sh
go version
go env GOROOT GOPATH
```

```text
go version go1.27.3 linux/amd64
/usr/local/go
/home/ada/go
```

`linux/amd64` names the operating system and processor; a Mac with Apple silicon shows
`darwin/arm64`. `go env` prints Go's settings. **GOROOT** is where Go itself lives: the compiler
and the standard library. **GOPATH** is a folder in your home directory (`%USERPROFILE%\go` on
Windows) where Go keeps downloaded code and installed tools. Your own projects can live anywhere.

## A module and its go.mod

Go code lives in a **module**: a folder with a file named `go.mod` at its top. Create one:

```sh
mkdir hello
cd hello
go mod init example.com/hello
```

```text
go: creating new go.mod: module example.com/hello
```

The new `go.mod` has two lines:

```text
module example.com/hello

go 1.27.3
```

- `module example.com/hello` is the **module path**, the module's name. Code you publish usually
  uses the address where it lives, such as `github.com/you/hello`; for practice, any name works.
- `go 1.27.3` is the minimum Go version the module needs. Since Go 1.21 an older Go will not
  build it itself; by default it downloads the newer version first. `go mod init` writes the
  version of the Go that ran it. (Go 1.26.0 alone wrote the previous version, `go 1.25.0`, as
  its release notes say; from Go 1.26.1 on, it writes its own version again.)

## The first program

Create `main.go` in the same folder:

```go
// Hello greets the visitors of the planetarium.
package main

import "fmt"

func main() {
	// Println prints its values, then starts a new line.
	fmt.Println("Hello from Go!")
	fmt.Println("Tonight's show starts at", "19:30")
}
```

Every `.go` file in a folder belongs to the same package. The file name is your choice; `main.go`
is the usual name for the file that holds `func main`.

## go run and go build

```sh
go run .
```

```text
Hello from Go!
Tonight's show starts at 19:30
```

The `.` means "the package in this folder". `go run` compiles the program into a temporary
folder, runs it, and throws the binary away: ideal while you work. `go build` keeps the binary:

```sh
go build
ls
./hello
```

```text
go.mod
hello
main.go
Hello from Go!
Tonight's show starts at 19:30
```

The binary is named after the last part of the module path: `hello`, or `hello.exe` on Windows,
where you run it as `.\hello.exe`. It is about 2 MB because it contains the Go runtime, and it runs
on any computer with the same operating system and processor, without Go installed.

## Formatting with gofmt

All Go code is laid out the same way: tabs for indentation, braces at the ends of lines, spacing
decided by a tool, not by taste. `gofmt -l .` lists the files whose layout differs, `gofmt -d`
shows what it would change, and `gofmt -w main.go` rewrites the file. For a messy `main.go`:

```sh
gofmt -d main.go
```

```text
diff main.go.orig main.go
--- main.go.orig
+++ main.go
@@ -1,6 +1,8 @@
 package main
+
 import "fmt"
+
 func main() {
-    fmt.Println("Starfield Planetarium")
-  fmt.Println( "Tonight: the northern sky" )
+	fmt.Println("Starfield Planetarium")
+	fmt.Println("Tonight: the northern sky")
 }
```

Lines starting with `-` are removed and lines starting with `+` added. `go fmt` (with a space)
runs `gofmt -l -w` on the whole package. Set your editor to format on save and you never think
about layout again.

## Checking with go vet

The compiler checks the rules of the language. **go vet** looks for code that compiles but is
probably wrong. This line runs, and prints `Doors open at %s 19:30`:

```go
fmt.Println("Doors open at %s", "19:30")
```

```sh
go vet .
```

```text
main.go:6:2: fmt.Println call has possible Printf formatting directive %s
```

`%s` means something only to `fmt.Printf` (lesson 6); `Println` prints it as it is. Write
`fmt.Println("Doors open at", "19:30")`. `go test` runs the most important vet checks by itself,
and so do this course's labs: a report like this one stops the build.

## Reading a compiler error

```go
package main

import "fmt"

func main() {
	fmt.println("Doors open at 19:30")
}
```

```text
# example.com/hello
./main.go:6:6: undefined: fmt.println (but have Println)
```

The first line names the package being built. Then come the file, the line (6), the column (6,
counting a tab as one column) and the message. Names are case-sensitive, and the compiler even
suggests the right one. When there are several errors, fix the first: later ones are often its
consequences.

## Comments, the Playground and your editor

`//` starts a comment that runs to the end of the line; `/* ... */` can span lines. A comment
directly above `package` or `func`, such as `// Hello greets...`, is a **doc comment**, which
`go doc` shows. It starts with the name of what it describes: here the program, `hello`.

The **Go Playground** at [go.dev/play](https://go.dev/play/) compiles and runs small programs in
the browser and gives you a link to share them. For real work, use an editor that understands
Go. VS Code with the Go extension, Neovim and many others use **gopls**, the Go language server,
to show errors as you type, complete names and format on save; GoLand has the same built in.

## Common mistakes

- **Brace on its own line.** `func main()` followed by `{` on the next line gives
  `./main.go:6:1: syntax error: unexpected semicolon or newline before {`. Go ends a statement at
  the end of a line, so the `{` must stay on the line of `func main()`.
- **No go.mod.** `go run .` in a folder without one fails with `go: go.mod file not found in
  current directory or any parent directory`. Run `go mod init` first, or `cd` into the module.
- **An unused import.** `./main.go:5:2: "os" imported and not used` is an error, not a warning.
  Delete the import.
- **A terminal opened before installing.** `command not found` (or "is not recognized" on
  Windows) for `go` usually means the terminal still has the old `PATH`. Open a new one.

## Practice

1. With Go 1.27.3, what does `go.mod` contain after `go mod init example.com/tidal`?
2. Which command lists the files in the current folder that `gofmt` would change?
3. Write a program that prints `Tide Times` and then `High water at 06:42`, and say which command
   runs it and which builds a binary.

### Answers

1. The module path and the version of the Go that ran the command:

   ```text
   module example.com/tidal

   go 1.27.3
   ```
2. `gofmt -l .`; `gofmt -w` would rewrite them, and `go fmt` does both for the package.
3. In the module from question 1, `go run .` runs it and `go build` writes the binary `tidal`.

   ```go
   package main

   import "fmt"

   func main() {
   	fmt.Println("Tide Times")
   	fmt.Println("High water at 06:42")
   }
   ```

   ```text
   Tide Times
   High water at 06:42
   ```

## Key takeaways

- Install Go from go.dev/dl and check it with `go version`; `go env` shows GOROOT and GOPATH.
- A module is a folder with a `go.mod`, made by `go mod init <path>`; its `go` line is the minimum
  Go version.
- `go run .` compiles and runs; `go build` writes one self-contained binary.
- `gofmt` (or `go fmt`) sets the one standard layout; `go vet` finds likely mistakes the compiler
  allows.
- A compiler error reads file:line:column: message. Fix the first one first.

## Further reading

- [Tutorial: Get started with Go](https://go.dev/doc/tutorial/getting-started)
- [Download and install](https://go.dev/doc/install)
- [How to Write Go Code](https://go.dev/doc/code)
- [Go by Example: Hello World](https://gobyexample.com/hello-world)
