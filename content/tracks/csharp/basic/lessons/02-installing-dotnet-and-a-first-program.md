---
title: Installing .NET and a First Program
summary: Install the .NET SDK, run a one-file program with dotnet run, learn what top-level statements and Main are, and create, build and run a console project.
minutes: 25
objectives:
  - Install the .NET 10 SDK and confirm which version is installed
  - Run a single-file program with `dotnet run hello.cs`
  - Explain how top-level statements relate to a `Main` method
  - Create a console project with `dotnet new console`, describe its project file, and build and run it
---

## Outline

1. The SDK and the runtime
2. Installing and checking
3. A program in one file
4. Statements, comments and `Write`
5. Top-level statements and `Main`
6. A console project
7. Reading your first errors

## The SDK and the runtime

.NET comes in two parts. The **runtime** runs finished programs. The **SDK** (software
development kit) builds them, and it contains the runtime, the C# compiler and the `dotnet`
command-line tool. A developer installs the SDK. Someone who only runs your program needs only
the runtime.

## Installing and checking

- **Windows**: download the .NET 10 SDK installer from `https://dotnet.microsoft.com/download`,
  or run `winget install Microsoft.DotNet.SDK.10` in a terminal. Installing Visual Studio 2026
  with a .NET workload also installs the SDK.
- **macOS**: download the installer from the same page.
- **Linux**: use your distribution's package manager, following the Microsoft Learn page for
  your distribution.

Any text editor works. Microsoft's install guide describes two: Visual Studio, and Visual Studio
Code with the C# Dev Kit extension. Open a **new** terminal, so that it sees the freshly installed
tool, and check:

```bash
dotnet --version
dotnet --list-sdks
```

`--version` prints the SDK version that `dotnet` will use, which starts with `10` for this
course. `--list-sdks` lists every SDK installed side by side.

## A program in one file

Since .NET 10 you can run a single `.cs` file directly. Make a folder, and in it a file named
`hello.cs`:

```csharp
Console.WriteLine("Hello, World!");
```

Then run it from that folder:

```bash
dotnet run hello.cs
```

```text
Hello, World!
```

`dotnet hello.cs` is a shorter form of the same command. This is a **file-based app**. It is not
a script: the first run compiles the file into a temporary folder, which takes a few seconds,
and later runs reuse that build until you change the file.

- `Console` is a class from the .NET libraries that represents the terminal window.
- `WriteLine` is a *method* of `Console`, a named piece of code you *call* with parentheses. It
  prints its *argument*, the value between the parentheses, and ends the line.
- `"Hello, World!"` is a *string literal*: text written directly in the code, in double quotes.
- The semicolon ends the *statement*, one instruction for the computer.

C# is case-sensitive: `console.writeline` is not the same name and does not compile.

## Statements, comments and `Write`

```csharp
// A greeting for the front desk
Console.WriteLine("Welcome to the clinic.");
Console.Write("Your number is ");
Console.WriteLine(42);
/* Write does not end the line,
   WriteLine does. */
Console.WriteLine("Please take a seat.");
```

```text
Welcome to the clinic.
Your number is 42
Please take a seat.
```

Statements run from top to bottom. `//` starts a *comment* that lasts to the end of the line,
and `/* ... */` can span several lines. The compiler ignores comments: they are notes for people.
`Console.Write` prints without ending the line, so the next output continues on it.

## Top-level statements and `Main`

Every C# program starts in a method called `Main`, its **entry point**. The programs above have
no `Main` because they use **top-level statements**: statements written directly in a file. The
compiler wraps them in a hidden class and entry-point method for you. Older code, and many
tutorials, write that wrapper out:

```csharp
namespace Greeter;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello from Main!");
        Console.WriteLine($"You passed {args.Length} arguments.");
    }
}
```

```text
Hello from Main!
You passed 0 arguments.
```

Both forms compile to the same kind of program. `args` holds the words typed after the program
name on the command line, and top-level statements can use `args` too. Only one file in a
program may contain top-level statements. A *namespace* groups related types under a name.
Lessons 8 and 11 explain `class` and `static`.

## A console project

A single file is ideal for learning. Real programs have several files, so they use a
**project**:

```bash
dotnet new console -o Greeter
cd Greeter
dotnet run
```

`dotnet new console` creates a project from the *console template*. `-o Greeter` puts it in a new
folder named `Greeter`, which also becomes the project's name. The folder contains `Program.cs`,
holding a comment and the hello-world line, and `Greeter.csproj`, the *project file*:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
```

- `OutputType` `Exe` means the project builds a program, not a library for other programs.
- `TargetFramework` `net10.0` means it runs on .NET 10.
- `ImplicitUsings` makes common *namespaces* such as `System` available in every file. That is
  why `Console`, whose full name is `System.Console`, needs no `using System;` line.
- `Nullable` turns on warnings about missing values, the subject of lesson 12.

`dotnet run` builds the project if anything changed, then runs it. `dotnet build` only builds:
the result goes to `bin/Debug/net10.0/`, with temporary files in `obj/`. Both folders are
generated and can be deleted at any time. A file-based app uses the same settings by default,
and `dotnet project convert hello.cs` turns one into a project when it outgrows a single file.

## Reading your first errors

Leave out a semicolon:

```csharp
Console.WriteLine("Hello, World!")
Console.WriteLine("Goodbye!");
```

```text
Program.cs(1,35): error CS1002: ; expected
```

Line 1, column 35 is just past the closing parenthesis, where the semicolon belongs. Now
misspell a method name:

```csharp
Console.Writeline("Hello, World!");
```

```text
Program.cs(1,9): error CS0117: 'Console' does not contain a definition for 'Writeline'
```

The compiler found `Console` but no member called `Writeline`, because the `L` should be
upper case. Your terminal shows the full path of the file in front of `Program.cs`.

## Common mistakes

- **Installing only the runtime.** `dotnet new` and `dotnet run` need the SDK. If
  `dotnet --list-sdks` prints nothing, install the SDK.
- **Using the old terminal.** If `dotnet` is "not recognized" right after installing, open a
  new terminal.
- **Running `dotnet run` in the wrong folder.** Without a file name it looks for a project in the
  current folder. Change into the project folder first.
- **Wrong capitals.** `console.WriteLine` and `Console.Writeline` are both errors.
- **Editing files in `bin` or `obj`.** They are rebuilt and overwritten. Your code lives in the
  `.cs` files.

## Practice

1. Write a file-based app `card.cs` that prints your name on one line and your city on the next,
   and run it.
2. Print `Total: 3 items` using one `Console.Write` call and one `Console.WriteLine` call.
3. Create a project named `Clock` with `dotnet new console`. Which two files does it contain,
   which .NET version does it target, and where does `dotnet build` put the result?

### Answers

**1.** Two statements, one per line of output, then `dotnet run card.cs`:

```csharp
Console.WriteLine("Ada Lovelace");
Console.WriteLine("London");
```

```text
Ada Lovelace
London
```

**2.** `Console.Write("Total: ");` followed by `Console.WriteLine("3 items");`. `Write` leaves
the line open, so the second text continues it.

**3.** `Program.cs` and `Clock.csproj`. The project file says `net10.0`. The build output goes to
`bin/Debug/net10.0/` inside the project folder.

## Key takeaways

- Install the SDK to build programs. It includes the runtime and the `dotnet` tool.
- `dotnet run hello.cs` builds and runs a one-file program.
- Top-level statements are compiled into a hidden `Main` method, the entry point every program
  has.
- `dotnet new console` creates a project file and `Program.cs`. `dotnet run` builds when needed
  and runs.

## Further reading

- [Microsoft Learn: Install .NET on Windows](https://learn.microsoft.com/en-us/dotnet/core/install/windows)
- [Microsoft Learn: Build file-based apps](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/file-based-programs)
- [Microsoft Learn: General structure of a C# program](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/program-structure/)
- [Microsoft Learn: C# console app template changes](https://learn.microsoft.com/en-us/dotnet/core/tutorials/top-level-templates)
