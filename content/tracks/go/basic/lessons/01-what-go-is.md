---
title: What Go Is and Where It Is Used
summary: Learn what a program, a programming language and a compiler are, where Go came from and what it was designed for, where it is used today, how to read a whole Go program line by line, and how the labs in this course check your code.
minutes: 20
objectives:
  - Explain what source code, a compiler and an executable are, and how compiled and interpreted languages differ
  - Describe where Go came from, what it was designed for and what the Go 1 compatibility promise guarantees
  - Name the kinds of software written in Go and some well-known Go projects
  - Read a small Go program and say what each line does
---

## Outline

1. Programs, languages and compilers
2. Where Go came from
3. What Go was designed for
4. Where Go is used
5. Reading a whole Go program
6. Statically typed: mistakes found before the program runs
7. How this course and its labs work

## Programs, languages and compilers

A **program** is a list of instructions that a computer carries out. You write those instructions
in a **programming language**: text with strict rules about what may be written where. The text you
write is called **source code**.

A processor cannot read source code. It runs **machine code**, long sequences of numbers that each
stand for a very small step. Something has to translate, and there are two common ways:

- A **compiler** translates the whole program into machine code *before* it runs. The result is an
  **executable** (also called a **binary**): a file you can run again and again without the
  compiler. C, Rust and Go work this way.
- An **interpreter** reads the source code and carries it out step by step *while* it runs, every
  time. Python is the best-known example.

A compiled program starts quickly, because the translation is already done, and the compiler reads
every line before anything runs, so it can reject many mistakes early.

## Where Go came from

Go was designed at Google. Robert Griesemer, Rob Pike and Ken Thompson started sketching it on a
whiteboard on 21 September 2007, frustrated that Google's large C++ programs took so long to
build. Go became open source on 10 November 2009, and **Go 1**, the first stable version, was
released on 28 March 2012.

Go 1 came with the **Go 1 compatibility promise**: a program written for Go 1 keeps compiling and
running, unchanged, with every later Go 1.x release (rare exceptions include security fixes). That
is why upgrading Go is normally safe.

A new version comes out twice a year, in February and August: Go 1.26 on 10 February 2026 and
Go 1.27 on 19 August 2026. Between them come **minor releases** with fixes. This course uses
Go 1.27; the newest minor release is Go 1.27.3.

## What Go was designed for

- **Simplicity.** The language is small (25 keywords) and usually offers one obvious way to do
  something, so other people's code holds few surprises.
- **Fast builds.** Even large programs compile in seconds.
- **One static binary.** `go build` produces a single file that contains everything the program
  needs. Copy it to a server and run it; nothing else has to be installed there.
- **Garbage collection.** Memory the program no longer uses is freed automatically.
- **Built-in concurrency.** Doing many things at once, such as serving thousands of network
  clients, is part of the language (the Advanced level).
- **One standard format.** The tool `gofmt` lays out every Go file the same way.

## Where Go is used

- **Cloud and network services**: web APIs, proxies and the back ends of large websites.
- **Command-line tools**: programs you run in a terminal, shipped as one file.
- **DevOps and infrastructure**: Docker (containers), Kubernetes (running containers on many
  machines), Terraform (cloud infrastructure from files) and Prometheus (monitoring) are all
  written in Go.

## Reading a whole Go program

You will install Go in the next lesson. For now, read a complete program:

```go
// Welcome prints the sign at the door of the harbour museum.
package main

import "fmt"

func main() {
	fmt.Println("Welcome to the Harbour Museum")
	fmt.Println("Open from", 10, "to", 17)
	fmt.Println("Hours open each day:", 17-10)
}
```

```text
Welcome to the Harbour Museum
Open from 10 to 17
Hours open each day: 7
```

Line by line:

- `// Welcome prints ...` is a **comment**. Everything after `//` on a line is for people; the
  compiler skips it.
- `package main` names the **package** this file belongs to. A package is a group of Go files that
  are compiled together. The name `main` is special: it makes a program you can run, not a library
  for other programs to use.
- `import "fmt"` brings in the package `fmt` (short for "format") from the **standard library**,
  the packages that come with Go. `fmt` contains the printing functions.
- `func main() {` starts a **function** called `main`: a named block of instructions, which runs
  from the `{` to the matching `}`. When the program starts, Go runs `main`; when `main` ends, the
  program ends.
- `fmt.Println(...)` **calls** the function `Println` from the package `fmt`. It prints the values
  between the parentheses, puts one space between them, and ends the line. `"Welcome to the
  Harbour Museum"` is a **string**, a piece of text in double quotes; `10` and `17` are numbers.
- `17-10` is worked out first, so `Println` receives `7`.

There are no semicolons at the ends of lines, and the lines inside `main` are indented with one
tab, the way `gofmt` lays them out.

## Statically typed: mistakes found before the program runs

Every value in Go has a **type**, the kind of value it is: `"Welcome"` is a string, `7` is an
integer (a whole number). Go is **statically typed**: the compiler checks every use of every value
against its type before the program runs. This line tries to add a number to a piece of text:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hours open each day: " + 7)
}
```

```text
./main.go:6:14: invalid operation: "Hours open each day: " + 7 (mismatched types untyped string and untyped int)
```

The program never runs. The message names the file, the line (6) and the column (14), then the
problem: `+` needs two values of the same type. A dynamically typed language would find this
only when the line runs, perhaps in front of a user. Lesson 4 turns numbers into text.

## How this course and its labs work

Each lesson ends with a **practice lab**, and each level with a mock exam and a bigger lab. A lab
gives you instructions, a file to complete, `solution.go`, and **tests**: small programs that run
your code and check what it did.

- **Run** compiles your file and runs the first test, which is **visible**: you see all of its
  output, including what it expected and what your code produced. If your file does not compile,
  Run shows the compiler's message instead.
- **Submit** runs the visible test again and several **hidden** tests. For a hidden test you see
  only its name and one line saying what was checked, not the answer.
- Labs are built the way `go test` builds code, with the **race detector** on: a checker that
  catches two parts of a program changing the same memory at once (it matters from the Advanced
  level on).

## Common mistakes

- **A typo in a name.** Names are case-sensitive and must be exact. `fmt.Prinln("Welcome")` gives
  `./main.go:6:6: undefined: fmt.Prinln`. Fix the spelling to `Println`.
- **Forgetting the import.** Using `fmt.Println` without `import "fmt"` gives
  `./main.go:4:2: undefined: fmt`. Every package you use must be imported.
- **A package other than main.** A file that starts `package museum` cannot be run: `go run .`
  reports `package example is not a main package` (`example` is the module's name). A program
  needs `package main` and a `func main()`.
- **Thinking the user needs Go installed.** They do not: a built binary runs on its own, on the
  operating system and processor it was built for.

## Practice

1. What does this program print?

   ```go
   package main

   import "fmt"

   func main() {
   	fmt.Println("Tickets:", 3*12, "euros")
   	fmt.Println("Doors", "open")
   	fmt.Println()
   	fmt.Println("Last entry", 17-1)
   }
   ```
2. Is Go compiled or interpreted, and what do you get from building a Go program?
3. You install Go in March 2027. Which Go release is likely to be the newest one then?

### Answers

1. `Println` with nothing between the parentheses prints an empty line:

   ```text
   Tickets: 36 euros
   Doors open

   Last entry 16
   ```
2. Compiled. `go build` translates the whole program into machine code ahead of time and writes one
   executable file that runs without Go installed.
3. Go 1.28: releases come every February and August, so Go 1.28 is due in February 2027.

## Key takeaways

- A compiler translates source code into machine code before the program runs. Go is compiled and
  statically typed, so many mistakes stop the build instead of reaching users.
- Go was designed at Google from 2007 and has been stable since Go 1 in 2012; the compatibility
  promise keeps old programs working. New versions come every February and August.
- Go aims for simplicity, fast builds, one static binary, garbage collection, built-in concurrency
  and one standard format.
- Go powers cloud services, command-line tools and infrastructure such as Docker and Kubernetes.
- A program is `package main` with a `func main()`; `fmt.Println` prints its values separated by
  spaces.

## Further reading

- [Go FAQ: origins and design](https://go.dev/doc/faq)
- [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat)
- [Go release history](https://go.dev/doc/devel/release)
- [Go use cases](https://go.dev/solutions/use-cases)
