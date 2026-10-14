---
title: Disposal and Resource Management
summary: Release files, connections and other scarce resources at a moment you choose with `IDisposable`, `using` statements and declarations, and `IAsyncDisposable`, and learn the dispose pattern and why you will almost never write a finalizer.
minutes: 25
objectives:
  - Explain why the garbage collector alone cannot be trusted to release files, sockets and locks
  - Use `using` statements, `using` declarations and `await using`, and predict the order in which objects are disposed
  - Implement `IDisposable` correctly for a sealed class and with the dispose pattern for a base class
  - Say when a finalizer is needed and why `SafeHandle` usually removes the need
---

## Outline

1. Why the garbage collector is not enough
2. `IDisposable` and the `using` statement
3. `using` declarations and disposal order
4. `IAsyncDisposable` and `await using`
5. Implementing `Dispose` correctly
6. Why finalizers are rare

## Why the garbage collector is not enough

The garbage collector (GC) frees *memory* that nothing refers to any more, at a time of its own choosing. That suits memory, which is plentiful and interchangeable. It does not suit **resources** that are scarce or visible outside your program: an open file that other programs cannot write to, a database connection from a pool of twenty, a network socket, a lock. Waiting for "some time later" to release those means a full pool, a locked file, a server that runs out of handles.

Such resources need **deterministic** cleanup: at a point in the code you choose, every time, even when an exception is thrown. .NET expresses that with the `IDisposable` interface, whose single method is `void Dispose()`. A type that owns a resource implements it, and whoever creates the object calls `Dispose()` when finished with it. `FileStream`, `StreamWriter`, HTTP responses, `CancellationTokenSource` and database connections all work this way.

## `IDisposable` and the `using` statement

Calling `Dispose()` by hand is easy to forget and easy to skip when an exception is thrown. The `using` statement does it for you: `using (var x = ...) { ... }` compiles to a `try`/`finally` that calls `x.Dispose()` in the `finally`, so it runs however the block is left. The type must implement `IDisposable` (or `IAsyncDisposable` with `await using`):

```text
error CS1674: 'object': type used in a using statement must implement 'System.IDisposable'.
```

## `using` declarations and disposal order

A **`using` declaration**, `using var x = ...;`, has no block: the object is disposed when the enclosing scope ends. Several of them are disposed in **reverse** order of declaration, because a later resource may depend on an earlier one (a writer on its stream).

```csharp
using (var report = new Resource("report.csv"))
{
    report.Write("header");
}
Console.WriteLine("---");
try
{
    using var input = new Resource("input.csv");
    using var output = new Resource("output.csv");
    output.Write("row 1");
    throw new InvalidOperationException("disk full");
}
catch (InvalidOperationException e)
{
    Console.WriteLine($"caught: {e.Message}");
}

sealed class Resource : IDisposable
{
    private readonly string _name;

    public Resource(string name)
    {
        _name = name;
        Console.WriteLine($"open {name}");
    }

    public void Write(string text) => Console.WriteLine($"  {_name} <- {text}");

    public void Dispose() => Console.WriteLine($"close {_name}");
}
```

```text
open report.csv
  report.csv <- header
close report.csv
---
open input.csv
open output.csv
  output.csv <- row 1
close output.csv
close input.csv
caught: disk full
```

Both files were closed *before* the `catch` ran, because the `try` block's scope ended when the exception left it. Prefer declarations when the resource should live to the end of the method; use the block form to release it earlier.

## `IAsyncDisposable` and `await using`

Some cleanup has to wait: flushing a buffer to a network stream, sending a "goodbye" message, closing a database transaction. Doing that inside `Dispose()` would block the thread. `IAsyncDisposable` declares `ValueTask DisposeAsync()`, and `await using` awaits it.

```csharp
await using (var log = new BufferedLog())
{
    log.Add("started");
    log.Add("finished");
}
Console.WriteLine("after the block");

sealed class BufferedLog : IAsyncDisposable
{
    private readonly List<string> _pending = new();

    public void Add(string line) => _pending.Add(line);

    public async ValueTask DisposeAsync()
    {
        await Task.Yield(); // stands in for writing to a slow disk
        Console.WriteLine($"flushed {_pending.Count} lines");
        _pending.Clear();
    }
}
```

```text
flushed 2 lines
after the block
```

`await using var log = ...;` works as a declaration too. Many types, such as `FileStream`, implement both interfaces; in async code prefer `await using`.

## Implementing `Dispose` correctly

A class should implement `IDisposable` when it **owns** something disposable: it created a `FileStream` and keeps it in a field, so it must dispose it in turn. That is **cascading** disposal. A class that merely uses a stream someone else owns does not dispose it.

Three rules apply to every implementation:

- **Idempotent.** Calling `Dispose` a second time must do nothing and must not throw.
- **Unusable afterwards.** Other members should throw `ObjectDisposedException`; `ObjectDisposedException.ThrowIf(disposed, this)` does it in one line.
- **No exceptions out of `Dispose`** if you can help it, since it often runs during exception handling.

For a `sealed` class, a `Dispose()` method with a `_disposed` flag is all you need. A class that may be inherited from uses the **dispose pattern**, so that derived classes can add their own cleanup: a public non-virtual `Dispose()` that calls `protected virtual void Dispose(bool disposing)` and then `GC.SuppressFinalize(this)`. A derived class overrides `Dispose(bool)`, cleans up its own state, and calls `base.Dispose(disposing)`.

```csharp
var connection = new AuditedConnection("db-1");
connection.Send("SELECT 1");
connection.Dispose();
connection.Dispose(); // the second call does nothing
try
{
    connection.Send("SELECT 2");
}
catch (ObjectDisposedException e)
{
    Console.WriteLine($"{e.GetType().Name}: {e.ObjectName}");
}

public class Connection(string name) : IDisposable
{
    private bool _disposed;

    protected string Name { get; } = name;

    public void Send(string sql)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Console.WriteLine($"{Name}: {sql}");
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) Console.WriteLine($"{Name}: socket closed");
        _disposed = true;
    }
}

public sealed class AuditedConnection(string name) : Connection(name)
{
    private bool _disposed;

    protected override void Dispose(bool disposing)
    {
        if (!_disposed && disposing) Console.WriteLine($"{Name}: audit log flushed");
        _disposed = true;
        base.Dispose(disposing);
    }
}
```

```text
db-1: SELECT 1
db-1: audit log flushed
db-1: socket closed
ObjectDisposedException: AuditedConnection
```

The `disposing` argument is `true` when the call comes from `Dispose()` and `false` when it comes from a finalizer. Only in the first case may the method touch other managed objects.

## Why finalizers are rare

A **finalizer**, written `~Connection() { ... }`, is a method the GC calls at some unknown time after an object becomes unreachable. It exists as a safety net for **unmanaged** resources, such as a raw operating-system handle held in an `IntPtr`, that nothing else would ever free. Finalizers are a poor tool: you do not control when they run, objects with finalizers cost more to allocate and survive an extra collection, and .NET (since .NET 5, and .NET Core before it) does not run them when the process exits.

You almost never need one. Wrap the handle in a `SafeHandle`, a class from the base library that owns one handle and already has a carefully written finalizer, and treat it as an ordinary disposable field. A class that holds only managed objects, including `SafeHandle`s, never needs a finalizer. That is why the pattern above still calls `GC.SuppressFinalize`: it costs nothing when there is no finalizer and spares the GC the work when a derived class adds one.

## Common mistakes

- **Not disposing what you create**, or disposing something you were handed and do not own.
- **`Dispose` that throws on the second call.**
- **Writing a finalizer** for a class that holds only managed objects.
- **Returning a `using` variable from a method.** The caller gets an object that is already disposed.

## Practice

1. Predict the output of `using var a = new Resource("a"); using (var b = new Resource("b")) { } using var c = new Resource("c");` at the end of a method.
2. Write a sealed `TempFile : IDisposable` that creates a temporary file when constructed and deletes it in `Dispose`, safely callable twice.
3. Why does the derived `AuditedConnection` keep its own `_disposed` flag instead of reading the base class's?

### Answers

1. `open a`, `open b`, `close b`, `open c`, `close c`, `close a`. The block form disposes `b` at its closing brace; the declarations are disposed in reverse order at the end of the method.
2. For example:

   ```csharp
   using var temp = new TempFile();
   Console.WriteLine(File.Exists(temp.FilePath));

   public sealed class TempFile : IDisposable
   {
       private bool _disposed;

       public string FilePath { get; } = Path.GetTempFileName(); // creates an empty file

       public void Dispose()
       {
           if (_disposed) return;
           File.Delete(FilePath);
           _disposed = true;
       }
   }
   ```

3. The base flag is `private`, so the derived class cannot see it, and it should not depend on the base class's internals anyway. Each level guards its own cleanup and then hands over to `base.Dispose`.

## Key takeaways

- The GC frees memory eventually; scarce resources need `Dispose` now.
- `using` turns disposal into a `try`/`finally`; declarations dispose in reverse order at the end of the scope.
- `await using` awaits `DisposeAsync` for cleanup that has to wait.
- `Dispose` must be idempotent, and a disposed object should throw `ObjectDisposedException`.
- Use `Dispose(bool)` for inheritable classes, and `SafeHandle` instead of finalizers.

## Further reading

- [Microsoft Learn: Implement a Dispose method](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose)
- [Microsoft Learn: Finalizers](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/finalizers)
- [Microsoft Learn: The await operator (asynchronous streams and disposables)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/await)
