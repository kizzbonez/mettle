---
title: Cancellation and Timeouts
summary: Stop asynchronous work on request with `CancellationTokenSource` and `CancellationToken`, understand why .NET cancellation is cooperative, and build timeouts that say what actually went wrong.
minutes: 25
objectives:
  - Pass a `CancellationToken` through a call chain and observe it by polling and with `ThrowIfCancellationRequested`
  - Explain how `OperationCanceledException` moves a task into the `Canceled` state
  - Build a timeout with `CancelAfter` and a linked token source, and tell a timeout apart from a caller's cancellation
  - State what `Task.WaitAsync` does and does not stop
---

## Outline

1. Why cancellation is cooperative
2. The source and the token
3. Listening for a request
4. `OperationCanceledException` and the `Canceled` state
5. Timeouts
6. Cleaning up

## Why cancellation is cooperative

The user closes the report before it has finished loading. A web request is abandoned by the browser. A shutdown begins. In each case some work should stop. .NET could stop it by force, killing a thread mid-statement, but that would leave files half written and locks held. So .NET cancellation is **cooperative**: one party *requests* cancellation, and the code doing the work *notices* the request at safe points and stops itself, cleaning up first.

## The source and the token

Two types split the job between the two parties:

- `CancellationTokenSource` belongs to whoever may cancel. Its `Cancel()` method makes the request, once and for all: a canceled source never becomes uncanceled.
- `CancellationToken` is a small struct read from `source.Token` and passed to the work. It can only *observe*: `IsCancellationRequested`, `ThrowIfCancellationRequested()`, and `Register(callback)` to run code when cancellation is requested.

Keeping the two apart means the work can never cancel itself by accident, and one `Cancel()` reaches every copy of the token. By convention a cancellable method takes the token as its last parameter, named `cancellationToken`, often with `= default`. The default value is `CancellationToken.None`, a token that can never be canceled.

## Listening for a request

Work notices a request in one of three ways: by checking the token between steps (**polling**), by passing it to the async APIs it calls, such as `Task.Delay(ms, token)` or a stream's `ReadAsync`, which stop their own waiting, or by registering a callback.

```csharp
using var stop = new CancellationTokenSource();
var printed = new List<int>();

Task job = PrintPagesAsync(Enumerable.Range(1, 10), page =>
{
    printed.Add(page);
    if (page == 3) stop.Cancel(); // the operator presses Stop
}, stop.Token);

try
{
    await job;
}
catch (OperationCanceledException e)
{
    Console.WriteLine($"stopped by our token: {e.CancellationToken == stop.Token}");
}
Console.WriteLine($"printed: {string.Join(",", printed)}");
Console.WriteLine($"status: {job.Status}");

static async Task PrintPagesAsync(IEnumerable<int> pages, Action<int> print, CancellationToken token)
{
    foreach (int page in pages)
    {
        token.ThrowIfCancellationRequested();
        print(page);
        await Task.Yield();
    }
}
```

```text
stopped by our token: True
printed: 1,2,3
status: Canceled
```

(The examples in this lesson need `using` lines for `System`, `System.Collections.Generic`, `System.Linq`, `System.Threading` and `System.Threading.Tasks`.) The request arrived during page 3, and the loop noticed it at the next check, before page 4. Where to check is your decision: often enough to stop promptly, never in the middle of a step that must not be left half done.

## `OperationCanceledException` and the `Canceled` state

`ThrowIfCancellationRequested()` throws `OperationCanceledException` (OCE), whose `CancellationToken` property records which token asked. When an async method lets an OCE escape, its task ends in the `Canceled` state rather than `Faulted`, and awaiting it rethrows the OCE. Many library methods throw the derived `TaskCanceledException`, so catch the base type, `OperationCanceledException`.

Nothing happens unless the work looks at the token:

```csharp
using var stop = new CancellationTokenSource();
stop.Cancel();
Task<int> polite = CountAsync(stop.Token, listen: true);
Task<int> deaf = CountAsync(stop.Token, listen: false);

foreach (var (name, task) in new[] { ("polite", polite), ("deaf", deaf) })
{
    try
    {
        Console.WriteLine($"{name}: finished with {await task}");
    }
    catch (OperationCanceledException e)
    {
        Console.WriteLine($"{name}: {e.GetType().Name}, status {task.Status}");
    }
}

static async Task<int> CountAsync(CancellationToken token, bool listen)
{
    int count = 0;
    for (int i = 0; i < 5; i++)
    {
        if (listen) token.ThrowIfCancellationRequested();
        await Task.Yield();
        count++;
    }
    return count;
}
```

```text
polite: OperationCanceledException, status Canceled
deaf: finished with 5
```

A method may also respond by simply returning early. That is fine for a loop that produces partial results, but its task then reports `RanToCompletion`, and the caller cannot tell that it stopped early. Throwing is the clearer signal.

## Timeouts

A timeout is cancellation requested by a clock. `source.CancelAfter(delay)` starts a countdown (calling it again restarts it), and `new CancellationTokenSource(delay)` does the same at construction. To honour both a caller's token and your own deadline, create a **linked** source with `CancellationTokenSource.CreateLinkedTokenSource(token)`: it is canceled when any token it links to is canceled, and it can also be canceled on its own.

```csharp
TimeSpan limit = TimeSpan.FromMilliseconds(100);

Console.WriteLine(await FetchWithTimeoutAsync(_ => Task.FromResult("rates: 1.08"), limit, CancellationToken.None));

try { await FetchWithTimeoutAsync(Hang, limit, CancellationToken.None); }
catch (TimeoutException e) { Console.WriteLine($"{e.GetType().Name}: {e.Message}"); }

using var user = new CancellationTokenSource();
user.Cancel();
try { await FetchWithTimeoutAsync(Hang, limit, user.Token); }
catch (OperationCanceledException e) { Console.WriteLine($"{e.GetType().Name}: the user gave up"); }

var slow = new TaskCompletionSource<string>();
try { await slow.Task.WaitAsync(limit); }
catch (TimeoutException) { Console.WriteLine($"stopped waiting; the operation finished: {slow.Task.IsCompleted}"); }

static async Task<string> Hang(CancellationToken token)
{
    await Task.Delay(Timeout.Infinite, token);
    return "never";
}

static async Task<string> FetchWithTimeoutAsync(
    Func<CancellationToken, Task<string>> fetch, TimeSpan limit, CancellationToken token)
{
    using var linked = CancellationTokenSource.CreateLinkedTokenSource(token);
    linked.CancelAfter(limit);
    try
    {
        return await fetch(linked.Token);
    }
    catch (OperationCanceledException) when (!token.IsCancellationRequested)
    {
        throw new TimeoutException($"no answer within {limit.TotalMilliseconds} ms");
    }
}
```

```text
rates: 1.08
TimeoutException: no answer within 100 ms
TaskCanceledException: the user gave up
stopped waiting; the operation finished: False
```

The `when` clause is an **exception filter** (lesson 6): the `catch` runs only if the caller did *not* cancel, so a timeout becomes a `TimeoutException` and the caller's own cancellation passes through untouched.

The last case shows `Task.WaitAsync(timeout)`, which faults with `TimeoutException` when time runs out. It stops your *waiting*, not the operation: the slow task is still pending. Use it only when you cannot pass a token to the operation itself.

## Cleaning up

`CancellationTokenSource` implements `IDisposable` (lesson 5), and a source with `CancelAfter` holds a timer, so dispose it when the operation is over: the `using var` above does that. `Register` returns a `CancellationTokenRegistration`; dispose it too when the callback is no longer wanted. Callbacks run synchronously inside `Cancel()`, so keep them short.

## Common mistakes

- **Accepting a token and never looking at it**, or not passing it on to the calls that wait.
- **Catching `TaskCanceledException`** and missing plain `OperationCanceledException`s.
- **Swallowing a cancellation** inside a general `catch (Exception)`, which makes a stopped operation look like a failed one.
- **Reusing a canceled source.** Create a new one for the next operation.

## Practice

1. In the first example, what is printed if the callback cancels at page 10 instead of 3?
2. Write `async Task<int> SumAsync(IEnumerable<int> numbers, CancellationToken cancellationToken = default)` that checks the token before adding each number and yields after each one.
3. With the caller's token and a 2-second deadline linked, the operation throws `OperationCanceledException`. How do you know which of the two caused it?

### Answers

1. `printed: 1,2,3,4,5,6,7,8,9,10` and `status: RanToCompletion`, with no "stopped" line. The loop never checks the token again after page 10, so the request goes unnoticed.
2. One possible version:

   ```csharp
   static async Task<int> SumAsync(IEnumerable<int> numbers, CancellationToken cancellationToken = default)
   {
       int total = 0;
       foreach (int n in numbers)
       {
           cancellationToken.ThrowIfCancellationRequested();
           total += n;
           await Task.Yield();
       }
       return total;
   }
   ```

3. Look at the caller's token: if `token.IsCancellationRequested` is true, the caller canceled; otherwise the deadline did. That is exactly the test in the exception filter above.

## Key takeaways

- Cancellation is cooperative: the source requests, the work notices and stops cleanly.
- Pass the token down to everything that waits, and check it between steps.
- An escaping `OperationCanceledException` makes a task `Canceled`; catch the base type.
- A timeout is a `CancelAfter` on a linked source; a filter tells it apart from the caller's cancellation.
- `WaitAsync` stops waiting, not the work. Dispose token sources.

## Further reading

- [Microsoft Learn: Cancellation in managed threads](https://learn.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads)
- [Microsoft Learn: Task cancellation](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-cancellation)
- [Microsoft Learn: CancellationTokenSource.CancelAfter](https://learn.microsoft.com/en-us/dotnet/api/system.threading.cancellationtokensource.cancelafter)
- [Microsoft Learn: Task.WaitAsync](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.waitasync)
