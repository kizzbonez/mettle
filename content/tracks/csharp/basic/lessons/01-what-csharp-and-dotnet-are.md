---
title: What C# and .NET Are
summary: What kind of language C# is, how .NET turns your code into a running program, where C# is used, and how this course teaches it.
minutes: 15
objectives:
  - Describe C# as a compiled, statically typed, object-oriented language that runs on .NET
  - Explain the path from source code to intermediate language to native code
  - Tell a compile-time error from a run-time exception, with one example of each
  - Explain how the lessons, the mock exam and the lab fit together
---

## Outline

1. What C# is
2. What .NET is
3. From source code to a running program
4. Two kinds of failure
5. Where C# is used
6. How this course works

## What C# is

C# (pronounced "C sharp") is a general-purpose programming language made by Microsoft. Its
first version was released in January 2002, and since 2021 a new version has arrived every
November together with a new version of .NET. This course uses C# 14, released in November 2025
with .NET 10. Four properties describe it:

- **Compiled.** A program called the *compiler* checks your *source code*, the text you write,
  and translates it into a form the computer can run before the program starts.
- **Statically typed.** Every value has a *type*, such as a whole number or a piece of text, and
  the compiler knows each type in advance. Mixing them up is reported before the program runs.
- **Object-oriented.** Programs are built from *classes*, which bundle data with the code that
  works on it. Lesson 11 shows how.
- **Garbage collected.** Memory your program no longer uses is freed automatically by a
  *garbage collector*, a service that runs alongside your code.

Here is a complete C# program. You are not expected to understand every line yet: the next
lessons explain each piece.

```csharp
// Rainfall in millimetres for three days
double[] rainfall = [3.5, 4.25, 2.0];
double total = 0;
foreach (double day in rainfall)
{
    total += day;
}
Console.WriteLine($"{rainfall.Length} days, {total} mm of rain");
```

```text
3 days, 9.75 mm of rain
```

## What .NET is

C# never runs alone. It runs on **.NET**, a free, open-source platform that works on Windows,
macOS and Linux. .NET is several things at once:

- the **runtime**, which runs your program and provides the garbage collector;
- the **libraries**, thousands of ready-made types such as `Console` (the text window) and
  `List` (a growing list of values), so you never write those yourself;
- the **compiler** for C# and the other .NET languages;
- the **SDK** (software development kit), the tools you install to build programs.

You may also meet the name *.NET Framework*. That is the original, Windows-only version, which
is now only maintained. Everything in this course uses modern .NET 10, a long-term support
release.

## From source code to a running program

Running C# takes two translation steps:

1. The C# compiler turns your source code into **intermediate language** (IL, also called CIL)
   and stores it, together with a description of your types, in a file called an *assembly*,
   usually ending in `.dll`. IL is not tied to any processor.
2. When the program runs, the .NET runtime's **just-in-time (JIT) compiler** turns each piece of
   IL into *native code*, the instructions your particular processor understands, the first time
   that piece is needed.

The second step is why one assembly runs unchanged on an Intel laptop and an ARM server: each
machine's runtime produces its own native code. The runtime also checks that the code only
touches memory it is allowed to, which is part of what makes C# *memory-safe*.

## Two kinds of failure

Because C# is statically typed, many mistakes never reach the running program. Here a piece of
text is put where a whole number belongs:

```csharp
int seats = "forty";
Console.WriteLine(seats);
```

```text
Program.cs(1,13): error CS0029: Cannot implicitly convert type 'string' to 'int'
```

Read a compiler error from left to right. `Program.cs` is the file, `(1,13)` is line 1, column
13, `CS0029` is the error code, which you can search for on Microsoft Learn, and the rest
explains the problem in words. No program is produced until every error is fixed.

Other mistakes can only show up while the program runs. Below, a position is calculated that
turns out to be 5 in a list of three values:

```csharp
double[] rainfall = [3.5, 4.25, 2.0];
int day = rainfall.Length + 2;
Console.WriteLine(rainfall[day]);
```

```text
Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.
   at Program.<Main>$(String[] args) in /home/ada/rainfall/Program.cs:line 3
```

The runtime refuses to read memory outside the list and stops the program with an
**exception**, a report of what went wrong and where. The path is the one on your machine.
Lesson 13 teaches how to read and handle exceptions.

## Where C# is used

Microsoft's documentation lists these as the main things people build with C#:

- **Web applications and services** with ASP.NET Core, including Blazor, which runs C# in the
  browser.
- **Desktop applications** with Windows Forms, WPF, and .NET MAUI, which also targets phones.
- **Cloud services** and long-running background services.
- **Games**: the Unity engine uses C# as its scripting language.
- **Devices** such as the Raspberry Pi, and AI and machine learning tools.

Most of .NET's own libraries are written in C#, so improvements to the language reach the whole
platform.

## How this course works

This level has fourteen lessons that start from nothing and build in order. Each one has
examples with the output they really produce, the mistakes beginners make most often, three
exercises with worked answers, and links to the Microsoft Learn pages it rests on. Type the
examples yourself instead of pasting them, and read every error message in full.

The level ends with a mock exam, which draws ten questions from a larger bank, and a lab in which
you write a small library for a tool-lending desk. The lab is compiled and tested automatically.

## Common mistakes

- **Confusing C# and .NET.** C# is the language you write. .NET is the platform that compiles,
  runs and supports it. Other languages, such as F#, run on .NET too.
- **Following .NET Framework tutorials.** Old material often assumes Windows and an outdated
  project layout. Check that a tutorial targets .NET 8 or later.
- **Treating "memory-safe" as "cannot fail".** The runtime stops bad memory access with an
  exception, but the program still stops unless you handle it.
- **Skimming errors.** The file, line, column and code in the first line usually point straight
  at the problem.

## Practice

1. Explain the difference between a compile-time error and an exception, with one example of
   each from this lesson.
2. In the CS0029 message above, which line and column does the error point to, and what is
   wrong there?
3. Change the first program so that it records a fourth day with 1.0 mm. What does it print?

### Answers

1. A compile-time error is reported by the compiler before anything runs, and no program is
   produced: assigning `"forty"` to an `int` is one. An exception happens while the program
   runs: reading position 5 of a three-value list starts fine and then stops with
   `IndexOutOfRangeException`.
2. Line 1, column 13, which is where `"forty"` starts. A `string` (text) cannot be stored in an
   `int` (a whole number).
3. Add the value to the list: `double[] rainfall = [3.5, 4.25, 2.0, 1.0];`. Nothing else
   changes, because the count and the total are worked out from the list.

```text
4 days, 10.75 mm of rain
```

## Key takeaways

- C# is compiled, statically typed and object-oriented, and its memory is managed by a garbage
  collector.
- .NET supplies the runtime, the libraries, the compiler and the SDK. This course uses C# 14 on
  .NET 10.
- The compiler produces IL in an assembly. The JIT compiler turns IL into native code while the
  program runs.
- Type mistakes are compile-time errors. Problems that depend on values, such as a bad position,
  are exceptions at run time.

## Further reading

- [Microsoft Learn: A tour of the C# language](https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/overview)
- [Microsoft Learn: Introduction to .NET](https://learn.microsoft.com/en-us/dotnet/core/introduction)
- [Microsoft Learn: Managed execution process](https://learn.microsoft.com/en-us/dotnet/standard/managed-execution-process)
- [Microsoft Learn: What you can build with C#](https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/what-you-can-build)
