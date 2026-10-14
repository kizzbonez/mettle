---
title: Iterators and Async Streams
summary: Produce sequences one item at a time with `yield return`, understand the deferred execution that makes them lazy, and consume data that arrives over time with `IAsyncEnumerable<T>` and `await foreach`.
minutes: 30
objectives:
  - Write an iterator method with `yield return` and `yield break`, and trace the order in which it and its caller run
  - Explain deferred execution and predict when an iterator's code, including argument checks, actually runs
  - Show that leaving a `foreach` early still runs an iterator's `finally` block
  - Write and consume an async stream, and cancel it with a token
---

## Outline

1. Sequences and enumerators
2. `yield return` and `yield break`
3. Deferred execution
4. Async streams
5. Cancelling an async stream

## Sequences and enumerators

`foreach` works on anything with a `GetEnumerator()` method, usually through `IEnumerable<T>`. The **enumerator** it returns, an `IEnumerator<T>`, has two members that matter: `MoveNext()` advances to the next item and returns `false` when there are none, and `Current` is the item it is on. The compiler turns a `foreach` into a loop over `MoveNext`, wrapped in a `try`/`finally` that disposes the enumerator.

Writing an enumerator class by hand means storing "where am I" in fields and rebuilding the loop around `MoveNext`. Iterators let the compiler do that.

## `yield return` and `yield break`

An **iterator** is a method that returns `IEnumerable<T>` or `IEnumerator<T>` and contains `yield return`. Each `yield return` hands one item to the caller and *pauses* the method right there. The next `MoveNext` resumes it on the following line. `yield break` ends the sequence, as does reaching the end of the method. As with async methods, the compiler rewrites the iterator into a state machine class.

```csharp
foreach (string batch in ReadBatches())
{
    Console.WriteLine($"  caller got {batch}");
    if (batch == "B-2") break;
}

Console.WriteLine(string.Join(",", Fibonacci().Skip(3).Take(5)));

static IEnumerable<string> ReadBatches()
{
    Console.WriteLine("iterator starts");
    try
    {
        for (int i = 1; i <= 4; i++)
        {
            Console.WriteLine($"iterator yields B-{i}");
            yield return $"B-{i}";
        }
    }
    finally
    {
        Console.WriteLine("iterator cleans up");
    }
}

static IEnumerable<long> Fibonacci()
{
    long a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}
```

```text
iterator starts
iterator yields B-1
  caller got B-1
iterator yields B-2
  caller got B-2
iterator cleans up
2,3,5,8,13
```

The two methods take turns, one item at a time. When the caller breaks out, `foreach` disposes the enumerator, and disposing a paused iterator runs its pending `finally` blocks, so a `using` inside an iterator closes its file even if the caller stops early. B-3 and B-4 are never produced.

`Fibonacci` never ends, and that is fine: it computes only what is asked for, and `Take(5)` stops asking.

Some places cannot contain `yield`: lambdas and anonymous methods, methods with `ref`, `out` or `in` parameters, `catch` and `finally` blocks, and (for `yield return`) a `try` block that has a `catch`:

```text
error CS1626: Cannot yield a value in the body of a try block with a catch clause
```

## Deferred execution

Calling an iterator method runs **none** of its body. It returns an object that will run the body when someone enumerates it, and runs it again each time someone enumerates it again. This is **deferred execution**, and LINQ's `Where`, `Select` and friends are built the same way.

```csharp
int runs = 0;
IEnumerable<int> squares = Squares(4);
Console.WriteLine($"created, runs = {runs}");
Console.WriteLine(string.Join(",", squares));
Console.WriteLine($"sum {squares.Sum()}, runs = {runs}");

IEnumerable<int> late = Squares(-1);
Console.WriteLine("created Squares(-1) without an error");
try { late.First(); }
catch (ArgumentOutOfRangeException) { Console.WriteLine("it throws only when enumerated"); }

try { CheckedSquares(-1); }
catch (ArgumentOutOfRangeException) { Console.WriteLine("CheckedSquares(-1) throws at the call"); }

IEnumerable<int> Squares(int count)
{
    ArgumentOutOfRangeException.ThrowIfNegative(count);
    runs++;
    for (int i = 1; i <= count; i++)
        yield return i * i;
}

static IEnumerable<int> CheckedSquares(int count)
{
    ArgumentOutOfRangeException.ThrowIfNegative(count);
    return Iterate();

    IEnumerable<int> Iterate()
    {
        for (int i = 1; i <= count; i++)
            yield return i * i;
    }
}
```

```text
created, runs = 0
1,4,9,16
sum 30, runs = 2
created Squares(-1) without an error
it throws only when enumerated
CheckedSquares(-1) throws at the call
```

Three consequences follow:

- **Repeated work.** `squares` ran twice, once for `Join` and once for `Sum`. If the source is expensive (a query, a file) or changes between runs, call `ToList()` once and reuse the list.
- **Late errors.** The argument check inside `Squares` ran only at `First()`, far from the bad call. `CheckedSquares` fixes that: it is an ordinary method that validates and then returns a local iterator function, so the check runs immediately.
- **Laziness is a feature.** Items are produced on demand, so an iterator can represent an endless or huge sequence and use memory for only one item at a time.

## Async streams

An iterator cannot `await`, and an async method returns only one value. When items arrive over time (pages from a web API, readings from a sensor, lines from a network stream) you want both. An **async stream** is a method declared `async` that returns `IAsyncEnumerable<T>` and contains both `await` and `yield return`.

Its enumerator, `IAsyncEnumerator<T>`, has `MoveNextAsync()`, which returns a `ValueTask<bool>`, and it is disposed with `DisposeAsync()` (lesson 5). You consume it with `await foreach`, which awaits each `MoveNextAsync` and disposes the enumerator at the end, even after a `break`.

```csharp
using var stop = new CancellationTokenSource();
try
{
    await foreach (double level in ReadTankLevelsAsync().WithCancellation(stop.Token))
    {
        Console.WriteLine($"level {level:F1} m");
        if (level < 2.5) stop.Cancel();
    }
}
catch (OperationCanceledException)
{
    Console.WriteLine("monitoring stopped");
}

double[] firstTwo = await ReadTankLevelsAsync().Take(2).ToArrayAsync();
Console.WriteLine(string.Join(" ", firstTwo));

static async IAsyncEnumerable<double> ReadTankLevelsAsync(
    [EnumeratorCancellation] CancellationToken token = default)
{
    double level = 4.0;
    while (true)
    {
        await Task.Delay(10, token); // wait for the next reading
        yield return level;
        level -= 0.5;
    }
}
```

```text
level 4.0 m
level 3.5 m
level 3.0 m
level 2.5 m
level 2.0 m
monitoring stopped
4 3.5
```

(`[EnumeratorCancellation]` lives in `System.Runtime.CompilerServices`.) Since .NET 10 the LINQ operators for async streams, such as `Where`, `Select`, `Take` and `ToArrayAsync`, are part of the base library, in the `System.Linq` namespace like ordinary LINQ.

## Cancelling an async stream

An async iterator receives a token in one of two ways. The caller can pass it as an argument, `ReadTankLevelsAsync(token)`. Or, when the stream was created elsewhere, the consumer can attach one with `.WithCancellation(token)`. The `[EnumeratorCancellation]` attribute on the parameter tells the compiler to deliver that second token to the same parameter. Without the attribute, a token given through `WithCancellation` never reaches your code.

Inside the iterator, pass the token to everything that waits, as `Task.Delay` does above. When the level dropped below 2.5 the loop canceled, the next `Task.Delay` threw, and the exception came out of `await foreach`.

## Common mistakes

- **Enumerating a lazy query twice** and paying for it twice, or seeing different results.
- **Validating arguments inside an iterator**, so the error appears far from the cause.
- **Returning `Task<List<T>>`** from a method that could stream: the caller waits for everything before seeing anything.
- **Forgetting `[EnumeratorCancellation]`**, so `WithCancellation` has no effect.

## Practice

1. Write an iterator `Countdown(int from)` that yields `from` down to 1, and use `yield break` to stop early if `from` is greater than 100.
2. What does `var q = Squares(3); runs = 0; q.ToList(); q.ToList();` leave in `runs`?
3. Write `async IAsyncEnumerable<string> PagesAsync(int count)` that awaits `Task.Yield()` before yielding each of `"page 1"` to `"page {count}"`, and print them with `await foreach`.

### Answers

1. One possible version:

   ```csharp
   static IEnumerable<int> Countdown(int from)
   {
       if (from > 100) yield break;
       for (int i = from; i >= 1; i--)
           yield return i;
   }
   ```

2. `2`. Creating `q` runs nothing, and each `ToList()` runs the whole body once.
3. For example:

   ```csharp
   await foreach (string page in PagesAsync(3))
       Console.WriteLine(page);

   static async IAsyncEnumerable<string> PagesAsync(int count)
   {
       for (int i = 1; i <= count; i++)
       {
           await Task.Yield();
           yield return $"page {i}";
       }
   }
   ```

## Key takeaways

- `yield return` pauses an iterator and hands one item to the caller; the compiler builds the state machine.
- Iterators are lazy: nothing runs until enumeration, and each enumeration runs again.
- Breaking out of `foreach` disposes the iterator and runs its `finally` blocks.
- Put argument checks in a wrapper method that returns a local iterator.
- `IAsyncEnumerable<T>` with `await foreach` streams items that arrive over time; cancel it with `[EnumeratorCancellation]` and `WithCancellation`.

## Further reading

- [Microsoft Learn: The yield statement](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/yield)
- [Microsoft Learn: Generate and consume async streams](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/generate-consume-asynchronous-stream)
