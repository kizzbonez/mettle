---
title: Exceptions and Error Messages
summary: Catch exceptions with try, catch and finally, recognize the common exception types, throw your own with a clear message, read a stack trace, and prefer TryParse-style checks for expected failures.
minutes: 30
objectives:
  - Handle exceptions with `try`, `catch` and `finally`, ordering catch clauses from specific to general
  - Name the common .NET exceptions and the mistakes that cause them
  - Throw `ArgumentException`, `ArgumentOutOfRangeException` and `InvalidOperationException` with useful messages
  - Read a stack trace to find where an exception started, and choose between a check and a catch
---

## Outline

1. What an exception is
2. `try` and `catch`
3. `finally`
4. The common exceptions
5. Throwing your own
6. Reading a stack trace
7. Catch what you can handle
8. `TryParse` versus catching

## What an exception is

An **exception** is an object that describes an error, created when an operation cannot do its
job. Creating it and handing it upward is called **throwing**. The method that was running
stops at once, then the method that called it, and so on up the chain of calls, until a
`catch` block that handles that kind of exception is found. If none is found, the program ends
with "Unhandled exception" and a report, as you have seen since lesson 1.

## `try` and `catch`

Code that might throw goes in a `try` block. Each `catch` block names a type of exception it
handles:

```csharp
string[] entries = ["12", "x", "99999999999", "7"];
int total = 0;
foreach (string entry in entries)
{
    try
    {
        int value = int.Parse(entry);
        total += value;
        Console.WriteLine($"Added {value}");
    }
    catch (FormatException)
    {
        Console.WriteLine($"'{entry}' is not a number");
    }
    catch (OverflowException ex)
    {
        Console.WriteLine($"'{entry}' is too big: {ex.Message}");
    }
}
Console.WriteLine($"Total {total}");
```

```text
Added 12
'x' is not a number
'99999999999' is too big: Value was either too large or too small for an Int32.
Added 7
Total 19
```

When `int.Parse` throws, the rest of the `try` block is skipped, the first matching `catch`
runs, and the program continues after the whole `try` statement, here with the next entry.
`ex` names the exception object. `ex.Message` is its description, and `ex.GetType().Name` its
type name.

## `finally`

A `finally` block runs when control leaves the `try`, whether it finished normally, returned
or threw. It is the place for clean-up that must always happen, such as resetting a status or
closing something:

```csharp
Console.WriteLine(Divide(10m, 4m));
try
{
    Divide(1m, 0m);
}
catch (DivideByZeroException ex)
{
    Console.WriteLine(ex.Message);
}

static decimal Divide(decimal a, decimal b)
{
    try
    {
        return a / b;
    }
    finally
    {
        Console.WriteLine("finally runs even on return");
    }
}
```

```text
finally runs even on return
2.5
finally runs even on return
Attempted to divide by zero.
```

The first call returned 2.5, but only after the `finally` block had printed its line. The second
call threw, the `finally` block still ran, and the exception carried on to the caller's `catch`.

## The common exceptions

| Exception | Typical cause |
| --- | --- |
| `FormatException` | `int.Parse("x")`: text in the wrong format |
| `OverflowException` | a number too big for its type, in `Parse` or `checked` code |
| `DivideByZeroException` | an integer or `decimal` divided by zero |
| `IndexOutOfRangeException` | an array index outside 0 to `Length - 1` |
| `ArgumentOutOfRangeException` | a list index out of range, or an argument outside its allowed range |
| `ArgumentException` | an argument that is not valid, such as a duplicate dictionary key |
| `KeyNotFoundException` | reading a missing dictionary key with the indexer |
| `NullReferenceException` | using a member of a `null` reference |
| `InvalidOperationException` | an object in the wrong state, such as a list changed during `foreach` |

All of them derive from `System.Exception`: each one *is an* `Exception` with extra detail. Some
are also more specific forms of others: `ArgumentOutOfRangeException` is an
`ArgumentException`, so `catch (ArgumentException)` catches both.

## Throwing your own

When your method receives a value it cannot work with, throw an exception that says so. Choose
the type that matches the problem and write a message a person can act on:

- `ArgumentException`: an argument is not valid.
- `ArgumentOutOfRangeException`: a number is outside the allowed range.
- `InvalidOperationException`: the call is not valid in the object's current state, for example
  returning a book that was never borrowed.

```csharp
try
{
    Pump.Start(-1);
}
catch (ArgumentException ex)
{
    Console.WriteLine(ex.GetType().Name);
    Console.WriteLine(ex.Message);
}

static class Pump
{
    public static void Start(int nozzle)
    {
        if (nozzle < 1 || nozzle > 8)
        {
            throw new ArgumentOutOfRangeException(nameof(nozzle), $"Nozzle {nozzle} does not exist.");
        }
        Console.WriteLine($"Nozzle {nozzle} started");
    }
}
```

```text
ArgumentOutOfRangeException
Nozzle -1 does not exist. (Parameter 'nozzle')
```

`throw new ...` creates the exception and throws it, so the line after it never runs.
`nameof(nozzle)` produces the text `"nozzle"`, and the exception adds it to the message. Unlike a
typed string, `nameof` is checked by the compiler and stays correct if the parameter is renamed.
Check arguments at the top of a method, before it changes anything, so a failed call leaves no
half-done work behind.

## Reading a stack trace

The report of an unhandled exception ends with a **stack trace**, the chain of method calls that
was active when it was thrown:

```csharp
Station.Report("pump-3=12;pump-x=4");

static class Station
{
    public static void Report(string line)
    {
        foreach (string pair in line.Split(';'))
        {
            Console.WriteLine(ReadPump(pair));
        }
    }

    static int ReadPump(string pair)
    {
        string[] parts = pair.Split('=');
        string id = parts[0].Substring(5);
        return int.Parse(id) * 100 + int.Parse(parts[1]);
    }
}
```

```text
312
Unhandled exception. System.FormatException: The input string 'x' was not in a correct format.
   at System.Number.ThrowFormatException[TChar](ReadOnlySpan`1 value)
   at System.Int32.Parse(String s)
   at Station.ReadPump(String pair) in /home/ada/station/Program.cs:line 17
   at Station.Report(String line) in /home/ada/station/Program.cs:line 9
   at Program.<Main>$(String[] args) in /home/ada/station/Program.cs:line 1
```

Read it from the top:

1. The first line gives the exception type and its message: `'x'` was not a number.
2. Each `at` line is one method that was running, the most recent first. The first lines are
   inside .NET itself (`System.Number`, `System.Int32.Parse`).
3. The first line that points into **your** file is where to look: line 17, in `ReadPump`.
4. The lines below show how the program got there: `Report` called `ReadPump` from line 9, and
   the top-level statements called `Report` from line 1.

The first pair worked and printed 312. The second has the id `x`. The file names and line
numbers come from the debugging information that the SDK writes next to your program when it
builds it.

## Catch what you can handle

- Order `catch` clauses from **specific to general**. A `catch (Exception)` first would catch
  everything, so the compiler rejects any clause after it with error CS0160, "A previous catch
  clause already catches all exceptions of this or of a super type ('Exception')".
- Only catch an exception when you can do something useful, such as skipping a bad line,
  asking again or reporting the problem clearly. Catching `Exception` and ignoring it hides bugs.
- Inside a `catch`, `throw;` on its own throws the same exception again, keeping its original
  stack trace, after you have, for example, logged it.

## `TryParse` versus catching

Exceptions are for situations that should not normally happen. Bad input from a person or a file
*does* happen normally, so check for it instead of catching:

```csharp
string[] entries = ["12", "x", "99999999999", "7"];
int total = 0;
foreach (string entry in entries)
{
    if (int.TryParse(entry, out int value))
    {
        total += value;
    }
    else
    {
        Console.WriteLine($"Skipped '{entry}'");
    }
}
Console.WriteLine($"Total {total}");
```

```text
Skipped 'x'
Skipped '99999999999'
Total 19
```

The same result, without any exceptions, which are relatively slow to throw. Use the `Try`
methods (`TryParse`, `TryGetValue`) and simple checks (`Count > 0`, `is not null`) for expected
situations, and let exceptions report the truly exceptional ones.

## Common mistakes

- **An empty `catch`.** The program carries on with wrong data and nobody knows why.
- **Catching `Exception` first.** Error CS0160. Put specific types first.
- **Using exceptions for normal control flow**, such as `Parse` inside `try` for every line of
  user input. Use `TryParse`.
- **Vague messages** such as "Error". Say what was wrong and with which value.
- **`throw ex;` to rethrow.** It restarts the stack trace at the `catch`. Write `throw;`.
- **Reading only the last line of a stack trace.** Start at the top and find your own file.

## Practice

1. Write `LitresFor(decimal money, decimal pricePerLitre)` that throws
   `ArgumentOutOfRangeException` when the price is zero or negative. What does
   `LitresFor(30m, 1.50m)` return?
2. In the stack trace above, which method threw first, and which line of your code called it?
3. A method fills a tank and should refuse to fill one that is already full. Which exception
   type fits, and why not `ArgumentException`?

### Answers

**1.**

```csharp
Console.WriteLine(Pump.LitresFor(30m, 1.50m));
Console.WriteLine(Pump.LitresFor(30m, 0m));

static class Pump
{
    public static decimal LitresFor(decimal money, decimal pricePerLitre)
    {
        if (pricePerLitre <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pricePerLitre), "The price must be positive.");
        }
        return money / pricePerLitre;
    }
}
```

```text
20
Unhandled exception. System.ArgumentOutOfRangeException: The price must be positive. (Parameter 'pricePerLitre')
   at Pump.LitresFor(Decimal money, Decimal pricePerLitre) in /home/ada/station/Program.cs:line 10
   at Program.<Main>$(String[] args) in /home/ada/station/Program.cs:line 2
```

**2.** `System.Number.ThrowFormatException` threw, inside `int.Parse`. Your code called it from
line 17, in `ReadPump`.
**3.** `InvalidOperationException`: nothing is wrong with the arguments, but the operation is not
valid in the tank's current state.

## Key takeaways

- An exception travels up the calls until a matching `catch`. Without one, the program ends.
- `finally` always runs. Order `catch` clauses from specific to general.
- Throw `ArgumentException`, `ArgumentOutOfRangeException` or `InvalidOperationException` with a
  clear message, using `nameof` for parameter names.
- Read a stack trace from the top, and find the first line in your own code. Use `TryParse` and
  checks for failures you expect.

## Further reading

- [Microsoft Learn: Exception-handling statements](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/exception-handling-statements)
- [Microsoft Learn: Exceptions and exception handling](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/)
- [Microsoft Learn: Best practices for exceptions](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions)
