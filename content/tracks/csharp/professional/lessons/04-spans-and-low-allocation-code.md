---
title: Spans and Low-Allocation Code
summary: Work on slices of strings and arrays without copying them, using Span<T>, ReadOnlySpan<T>, stackalloc, ArrayPool<T> and Memory<T>, and see what C# 14's implicit span conversions changed.
minutes: 30
objectives:
  - Explain what a span is, where its memory can come from, and why it is restricted to the stack
  - Parse and format text with spans so that the hot path allocates nothing
  - Use `stackalloc` with a size limit and `ArrayPool<T>` with a correct rent and return
  - Choose between `Span<T>` and `Memory<T>`, and use C# 14's implicit span conversions
---

## Outline

1. What a span is
2. Parsing without allocating
3. `stackalloc` and formatting into a buffer
4. `ArrayPool<T>`
5. `Memory<T>` and ownership
6. What C# 14 changed

## What a span is

`Span<T>` is a view of a contiguous run of `T` values: a reference to the first element and a
length. It owns nothing and copies nothing. The memory behind it can be an array, part of an
array, a block on the stack, native memory, or (for `ReadOnlySpan<char>`) the characters of a
string. **Slicing** (`span[4..]`, `span.Slice(2, 3)`) makes a new view of part of the same
memory in constant time, with bounds checks. `ReadOnlySpan<T>` is the same view without write
access, and it is what you get from a string, because strings are immutable.

A span can point into the stack, and the stack frame it points into disappears when its method
returns. So `Span<T>` is a **ref struct**, a type the compiler keeps on the stack: it cannot be a
field of a class, cannot be boxed or captured by a lambda, and cannot live across an `await`.
Those rules are what make spans safe, and they are also why `Memory<T>` exists (below).

## Parsing without allocating

`string.Split` and `Substring` copy: every part becomes a new string. With spans you find the
boundaries and parse the characters where they are. Since .NET 9, `MemoryExtensions.Split` on a
`ReadOnlySpan<char>` yields `Range` values instead of strings, and `int.Parse` and its relatives
accept spans:

```csharp
using System.Globalization;

static long AllocatedBy(Action work)
{
    work();
    long before = GC.GetAllocatedBytesForCurrentThread();
    work();
    return GC.GetAllocatedBytesForCurrentThread() - before;
}

const string Header = "sku=AB-1234;qty=7;price=19.99";
int total = 0;
long splitBytes = AllocatedBy(() =>
    total += int.Parse(Header.Split(';')[1].Substring(4), CultureInfo.InvariantCulture));
long spanBytes = AllocatedBy(() => total += ParseQuantity(Header));
Console.WriteLine($"Split + Substring: {splitBytes} B, spans: {spanBytes} B, qty = {ParseQuantity(Header)}");

static int ParseQuantity(ReadOnlySpan<char> line)
{
    foreach (Range part in line.Split(';'))
    {
        ReadOnlySpan<char> field = line[part];
        if (field.StartsWith("qty="))
            return int.Parse(field["qty=".Length..], NumberStyles.None, CultureInfo.InvariantCulture);
    }
    throw new FormatException("no qty field");
}
```

```text
Split + Substring: 200 B, spans: 0 B, qty = 7
```

Two hundred bytes is nothing once. Two million lines a night is 400 MB of garbage. The span
version also accepts a `string`, a `char[]` or a slice of a larger buffer, because all of them
convert to `ReadOnlySpan<char>`. The trade-off is readability: span code is lower level, so
keep it in the hot paths a profile points to.

## `stackalloc` and formatting into a buffer

`stackalloc T[n]` reserves `n` elements on the current method's stack frame; assigned to a
`Span<T>`, it needs no `unsafe` code. The memory is free as soon as the method returns, and the
GC never sees it. Primitive types have `TryFormat` methods that write into a span, so you can
build a value piece by piece and allocate only the final string:

```csharp
using System.Globalization;

Span<char> buffer = stackalloc char[32];
int orderId = 40917;
"ORD-".CopyTo(buffer);
orderId.TryFormat(buffer[4..], out int written, "D8", CultureInfo.InvariantCulture);
Console.WriteLine(new string(buffer[..(4 + written)]));
```

```text
ORD-00040917
```

The stack is small, its size depends on the environment, and overflowing it throws a
`StackOverflowException` that ends the process. The rules from the C# reference: keep
`stackalloc` small and bounded, fall back to the heap above a limit
(`n <= 256 ? stackalloc char[n] : new char[n]`), never put it inside a loop, and treat its
contents as undefined until you write them, unlike memory from `new`, which starts zeroed.

## `ArrayPool<T>`

When a buffer is too big for the stack, or must outlive the method, rent it.
`ArrayPool<T>.Shared.Rent(minimumLength)` returns an array **at least** that long, and
`Return(array)` hands it back for reuse:

```csharp
using System.Buffers;

byte[] rented = ArrayPool<byte>.Shared.Rent(100);
Console.WriteLine($"asked for 100, got {rented.Length}");
rented[0] = 0xAB;
ArrayPool<byte>.Shared.Return(rented);

byte[] again = ArrayPool<byte>.Shared.Rent(120);
Console.WriteLine($"same array again: {ReferenceEquals(rented, again)}, first byte = 0x{again[0]:X2}");
ArrayPool<byte>.Shared.Return(again, clearArray: true);
```

```text
asked for 100, got 128
same array again: True, first byte = 0xAB
```

Three consequences. Use only the length you asked for, never `rented.Length`. A rented array may
contain old data, so pass `clearArray: true` when it held anything sensitive. And never touch an
array after returning it: someone else may already be using it. Return it in a `finally`;
forgetting is not fatal, but the pool has to allocate a replacement.

## `Memory<T>` and ownership

`Memory<T>` describes the same kinds of memory as a span (except the stack), but it is an
ordinary struct, so it can be a field and can cross an `await`. Call `.Span` when you are ready
to work on it. Microsoft's guidelines, in short: synchronous methods take `Span<T>` or
`ReadOnlySpan<T>`; asynchronous ones take `Memory<T>` or `ReadOnlyMemory<T>`; and a method that
receives a buffer may use it only until it returns (or until its returned `Task` completes),
because the caller may reuse the buffer straight after. Code that must keep data longer copies
it.

## What C# 14 changed

C# 14 makes spans first-class: the language now has implicit conversions from `T[]` to
`Span<T>` and `ReadOnlySpan<T>`, from `Span<T>` to `ReadOnlySpan<T>`, and from `string` to
`ReadOnlySpan<char>`, and it applies them in places C# 13 did not, notably to the receiver of
an extension method and in generic type inference. One span-based helper now serves strings
and arrays alike:

```csharp
Console.WriteLine("banana".CountOf('a'));
int[] readings = [3, 1, 4, 1, 5];
Console.WriteLine(readings.CountOf(1));

static class SpanExtensions
{
    public static int CountOf<T>(this ReadOnlySpan<T> items, T value) where T : IEquatable<T>
    {
        int count = 0;
        foreach (T item in items)
            if (item.Equals(value)) count++;
        return count;
    }
}
```

```text
3
2
```

Compiled with `-langversion:13`, both calls fail with error CS1929 ("requires a receiver of
type `ReadOnlySpan<char>`"). The new rules also prefer span overloads when both exist, which is
a breaking change in places: `array.Reverse()` would now bind to the in-place
`MemoryExtensions.Reverse`, so .NET 10 added an array overload of LINQ's `Reverse` to keep old
code meaning what it meant.

## Common mistakes

- Returning a span over a `stackalloc` buffer or a local array that is about to go away.
- Using `rented.Length` instead of the length you asked for.
- Using a pooled array after `Return`, or returning it twice.
- Unbounded `stackalloc` sized by user input.
- Rewriting cold code with spans where `Split` was perfectly clear.

## Practice

1. Why can an `async` method not keep a `Span<byte>` local across `await`, and what type would
   you use instead?
2. Write `static bool TryReadPort(ReadOnlySpan<char> hostAndPort, out int port)` for input such
   as `db01:5432`, without allocating.
3. A method rents `ArrayPool<char>.Shared.Rent(len)`, fills it and returns
   `new string(buffer)`. What is wrong?

### Answers

1. A span may point into the stack, and an `await` can end the method's stack frame while the
   method is suspended, so the compiler forbids it. Use `Memory<byte>` and take `.Span` in the
   synchronous parts between awaits.
2. Search from the end, so that only the last colon counts, and parse the slice after it
   (`using System.Globalization;`):

   ```csharp
   static bool TryReadPort(ReadOnlySpan<char> hostAndPort, out int port)
   {
       port = 0;
       int colon = hostAndPort.LastIndexOf(':');
       return colon >= 0 && int.TryParse(hostAndPort[(colon + 1)..], NumberStyles.None,
           CultureInfo.InvariantCulture, out port);
   }
   ```
3. The rented array may be longer than `len`, so the string gets extra characters, and old data
   from a previous renter. Use `new string(buffer, 0, len)`, and return the array in a
   `finally`.

## Key takeaways

- A span is a bounds-checked view; slicing and parsing with spans copies nothing.
- Spans live on the stack; `Memory<T>` is for fields and async code.
- `stackalloc` small, bounded buffers; rent bigger ones from `ArrayPool<T>` and return them.
- C# 14 converts arrays and strings to spans implicitly, even for extension methods.

## Further reading

- [`Memory<T>` and `Span<T>` usage guidelines](https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/memory-t-usage-guidelines)
- [C# reference: stackalloc](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/stackalloc)
- [`ArrayPool<T>` class](https://learn.microsoft.com/en-us/dotnet/api/system.buffers.arraypool-1)
- [Feature specification: first-class span types (C# 14)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-14.0/first-class-span-types)
