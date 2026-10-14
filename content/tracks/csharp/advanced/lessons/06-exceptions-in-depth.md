---
title: Exceptions in Depth
summary: Design your own exception types, catch selectively with exception filters, rethrow without losing the stack trace, understand how exceptions travel through tasks and `AggregateException`, and know exactly what `finally` guarantees.
minutes: 30
objectives:
  - Write a custom exception with the three standard constructors and an inner exception
  - Use an exception filter and explain why it runs before the stack is unwound
  - Choose between `throw;`, `throw ex;` and wrapping, and predict what each does to the stack trace
  - Predict which exception `await`, `.Wait()` and `Task.Exception` give for a task that failed more than once
---

## Outline

1. When to write your own exception
2. Exception filters
3. `throw;` versus `throw ex;`
4. Exceptions and tasks
5. What `finally` guarantees

## When to write your own exception

The basic level showed `try`, `catch` and `throw` with built-in types. Prefer those types when they fit: `ArgumentException` and its relatives for bad arguments, `InvalidOperationException` when an object is in the wrong state for a call. Write a **custom exception** when callers need to catch *your* failure specifically, or need data about it that a message string cannot carry.

The conventions: derive from `Exception`, end the name in `Exception`, provide the three standard constructors (none, a message, a message and an **inner exception**), and add properties for the extra data. When you translate a low-level failure into your own, pass the original as the inner exception so the root cause is not lost.

## Exception filters

A `catch` clause can carry a condition: `catch (ImportException e) when (e.LineNumber > 1)`. This **exception filter** is evaluated when the exception is thrown; if it is `false`, the clause is skipped as if it did not match, and the search continues outward.

```csharp
try
{
    Importer.Total(["sku=A1;qty=4", "sku=B2;qty=four"]);
}
catch (ImportException e) when (e.LineNumber > 1)
{
    Console.WriteLine($"{e.Message} on line {e.LineNumber}");
    Console.WriteLine($"cause: {e.InnerException?.GetType().Name}");
}

try
{
    try { throw new InvalidOperationException("boom"); }
    finally { Console.WriteLine("inner finally"); }
}
catch (Exception e) when (Log(e)) { }
catch (InvalidOperationException) { Console.WriteLine("handled"); }

foreach (bool withEx in new[] { false, true })
{
    try { Rethrow(withEx); }
    catch (FormatException e)
    {
        string how = withEx ? "throw ex;" : "throw;";
        Console.WriteLine($"{how} trace still shows ParseQuantity: {e.StackTrace!.Contains("ParseQuantity")}");
    }
}

static bool Log(Exception e)
{
    Console.WriteLine($"log: {e.Message}");
    return false; // never handles, only watches
}

static void Rethrow(bool withEx)
{
    try { Importer.ParseQuantity("qty=x"); }
    catch (FormatException ex)
    {
        if (withEx) throw ex;
        throw;
    }
}

public sealed class ImportException : Exception
{
    public ImportException() { }
    public ImportException(string message) : base(message) { }
    public ImportException(string message, Exception inner) : base(message, inner) { }

    public int LineNumber { get; init; }
}

static class Importer
{
    public static int Total(string[] lines)
    {
        int total = 0;
        for (int i = 0; i < lines.Length; i++)
        {
            try
            {
                total += ParseQuantity(lines[i]);
            }
            catch (FormatException e)
            {
                throw new ImportException($"bad quantity in \"{lines[i]}\"", e) { LineNumber = i + 1 };
            }
        }
        return total;
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    public static int ParseQuantity(string line) => int.Parse(line.Split("qty=")[1]);
}
```

```text
bad quantity in "sku=B2;qty=four" on line 2
cause: FormatException
log: boom
inner finally
handled
throw; trace still shows ParseQuantity: True
throw ex; trace still shows ParseQuantity: False
```

(The example needs `using System.Runtime.CompilerServices;` for `[MethodImpl]`, which stops the compiler from inlining `ParseQuantity` so its frame shows in the trace.)

Look at the order in the middle block: `log: boom` comes *before* `inner finally`. A filter runs while the method that threw is still on the stack, before any `finally` blocks between it and the handler have run. That makes filters better than catching and rethrowing: a debugger or crash dump still sees the original state, and a filter that always returns `false` is a neat way to log every exception that passes without handling any.

## `throw;` versus `throw ex;`

Inside a `catch`, you sometimes need to do something (record, undo a half-done change) and let the exception continue. How you continue matters:

- `throw;` rethrows the **same** exception with its stack trace intact.
- `throw ex;` throws the same object again, but **resets** its stack trace to the current line. Everything below is lost, which is why the trace above no longer mentions `ParseQuantity`. The code analysis rule CA2200 flags it.
- `throw new ImportException("...", ex);` **wraps** it: a new type and message for your callers, with the original kept as `InnerException`.

Use `throw;` to pass on, and wrap when you are changing the level of abstraction, as `Importer` does. Never `throw ex;`.

## Exceptions and tasks

An exception thrown inside an async method does not leave the method at the throw. The state machine catches it and stores it in the returned task, which becomes `Faulted`. It reappears when someone awaits the task. A task can hold several exceptions, so `Task.Exception` is an **`AggregateException`**, an exception whose `InnerExceptions` list holds the real ones.

```csharp
Task both = Task.WhenAll(CheckDepotAsync("north"), CheckDepotAsync("south"));
try { await both; }
catch (Exception e) { Console.WriteLine($"await threw {e.GetType().Name}: {e.Message}"); }
Console.WriteLine($"the task holds: {string.Join(", ", both.Exception!.InnerExceptions.Select(x => x.Message))}");
try { both.Wait(); }
catch (AggregateException e) { Console.WriteLine($"Wait threw AggregateException with {e.InnerExceptions.Count} inside"); }

Task<int> pending = CountAsync(null!);
Console.WriteLine($"no exception at the call; status {pending.Status}");

static async Task CheckDepotAsync(string depot)
{
    await Task.Yield();
    throw new InvalidOperationException($"{depot} offline");
}

static async Task<int> CountAsync(string text)
{
    ArgumentNullException.ThrowIfNull(text);
    await Task.Yield();
    return text.Length;
}
```

```text
await threw InvalidOperationException: north offline
the task holds: north offline, south offline
Wait threw AggregateException with 2 inside
no exception at the call; status Faulted
```

- `await` unwraps and rethrows the **first** exception, so ordinary `catch` clauses work. With `WhenAll`, the others are not lost: they are still in the task's `Exception` property if you need them.
- `.Wait()` and `.Result` throw the `AggregateException` itself, one more reason to await.
- Even the argument check in `CountAsync` was stored in the task instead of thrown at the call, because it is inside the async method. Microsoft's guidance is that usage errors such as bad arguments should be thrown **synchronously**: validate in an ordinary method, then call the async part (practice 3).

## What `finally` guarantees

A `finally` block runs however its `try` is left: normally, by `return`, `break` or `continue`, or by an exception that is handled somewhere up the stack.

```csharp
Console.WriteLine(Ship());
try { Risky(); }
catch (Exception e) { Console.WriteLine($"caller sees: {e.Message}"); }

static string Ship()
{
    try { return "shipped"; }
    finally { Console.WriteLine("finally runs before the value is returned"); }
}

static void Risky()
{
    try { throw new InvalidOperationException("label printer jammed"); }
    finally { throw new IOException("log file locked"); }
}
```

```text
finally runs before the value is returned
shipped
caller sees: log file locked
```

Two limits. An exception thrown inside `finally` **replaces** the one in flight: the jammed printer, the real problem, vanished. So keep `finally` blocks simple and never throw from them. And the guarantee needs the process to keep running: `Environment.FailFast`, a stack overflow or a killed process skip it, and for an exception that nobody handles, whether `finally` blocks run before the process ends is not guaranteed.

## Common mistakes

- **`catch (Exception)` that swallows everything**, including bugs and cancellations. Catch what you can handle.
- **`throw ex;`**, which destroys the stack trace.
- **Wrapping without the inner exception**, which loses the cause.
- **Expecting `catch (InvalidOperationException)` to catch `.Wait()` failures.** It receives an `AggregateException`.

## Practice

1. Add a `catch (ImportException e) when (e.LineNumber == 1)` clause in front of the first `catch` in the first example. Which one handles the error, and why?
2. What does `catch (Exception e) when (e is not OperationCanceledException)` achieve?
3. Rewrite `CountAsync` so that `CountAsync(null!)` throws at the call.

### Answers

1. Still the original clause. The new filter is evaluated first and returns `false` (the bad line is line 2), so the search moves on to the next clause.
2. It handles every failure except cancellation, which passes through untouched to code that expects it.
3. Validate in a non-async method and put the awaiting in a local function:

   ```csharp
   static Task<int> CountAsync(string text)
   {
       ArgumentNullException.ThrowIfNull(text);
       return CountCoreAsync(text);

       static async Task<int> CountCoreAsync(string text)
       {
           await Task.Yield();
           return text.Length;
       }
   }
   ```

## Key takeaways

- Custom exceptions: derive from `Exception`, three constructors, extra data as properties, and keep the inner exception.
- A filter decides before unwinding; `false` means "not mine".
- `throw;` keeps the stack trace, `throw ex;` destroys it, wrapping adds context.
- `await` rethrows the first exception; `Task.Exception` and `.Wait()` give the `AggregateException`.
- `finally` runs on every exit of a handled flow, but an exception thrown in it replaces the original.

## Further reading

- [Microsoft Learn: Exception-handling statements (throw, try, catch, finally, when)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/exception-handling-statements)
- [Microsoft Learn: Best practices for exceptions](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions)
- [Microsoft Learn: Asynchronous programming, handle asynchronous exceptions](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)
