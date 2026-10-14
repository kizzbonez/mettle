---
title: Async and Await
summary: What a `Task` is, what `async` and `await` really do, how to run independent work at the same time with `Task.WhenAll` and `Task.WhenAny`, and why asynchronous code has to be asynchronous all the way up.
minutes: 30
objectives:
  - Predict the order in which an async method and its caller run, given where the first incomplete `await` is
  - Describe the state machine the compiler generates for an async method
  - Start independent operations together and combine them with `Task.WhenAll` and `Task.WhenAny`
  - Explain why blocking on a task with `.Result` or `.Wait()`, and writing `async void` methods, cause bugs
---

## Outline

1. Why asynchronous code exists
2. A task is a promise of a result
3. What `async` and `await` do
4. What the compiler generates
5. Running work at the same time
6. Async all the way
7. `ValueTask` in one paragraph

## Why asynchronous code exists

Most programs spend much of their time waiting for a database, a web service or a disk. Code that waits by **blocking** keeps a thread occupied doing nothing. In a desktop app that thread draws the window, so the window freezes. In a server each blocked thread is one fewer for other requests, and threads are expensive.

**Asynchronous** code starts the operation, gives the thread back, and continues when the result arrives. C# lets you write it as ordinary step-by-step code with `async` and `await`. It is about waiting well, not computing faster: `async` and `await` do not create threads.

## A task is a promise of a result

`Task` (in `System.Threading.Tasks`) represents an operation that may not have finished yet. `Task<TResult>` also carries the result. A task's `Status` says where it is: still waiting, `RanToCompletion`, `Faulted` (it holds the exception that ended it) or `Canceled`. By convention, methods that return a task end in `Async`.

The examples use `TaskCompletionSource<T>`, a task that you complete by hand with `SetResult` or `SetException`. It makes the order of events visible without depending on timing.

## What `async` and `await` do

The `async` modifier allows `await` inside a method and makes the compiler build the returned task for you. `await t` then does one of two things:

- If `t` has already completed, execution simply continues with its result.
- If not, the method is **suspended**: the rest of it is registered as a **continuation** (code to run later), and control returns to the caller with an incomplete task. When `t` completes, the method resumes after the `await`. If `t` failed, `await` rethrows its exception.

```csharp
using System;
using System.Threading.Tasks;

var parcel = new TaskCompletionSource<int>();

Task<int> label = PrintLabelAsync(parcel.Task);
Console.WriteLine($"2. caller continues, label is {label.Status}");

parcel.SetResult(7);
Console.WriteLine($"4. label number {await label}");

static async Task<int> PrintLabelAsync(Task<int> parcelArrives)
{
    Console.WriteLine("1. runs synchronously until the first await");
    int weight = await parcelArrives;
    Console.WriteLine("3. resumes once the parcel task completes");
    return weight * 100;
}
```

```text
1. runs synchronously until the first await
2. caller continues, label is WaitingForActivation
3. resumes once the parcel task completes
4. label number 700
```

The call ran line 1 at once, like any method. Only at an `await` on an unfinished task did control go back to the caller. `await` is allowed only in async methods:

```csharp
static int Length(Task<string> download)
{
    string text = await download;
    return text.Length;
}
```

```text
error CS4032: The 'await' operator can only be used within an async method. Consider marking this method with the 'async' modifier and changing its return type to 'Task<int>'.
```

An async method returns `Task`, `Task<T>`, `ValueTask<T>`, `IAsyncEnumerable<T>` (lesson 4) or, for event handlers only, `void`. It cannot have `ref` or `out` parameters.

## What the compiler generates

The compiler rewrites an async method into a **state machine**: a struct that stores the parameters, the locals that must survive an `await`, a number recording where the method paused, the awaiter it is waiting on, and a **builder** that produces the task. Reflection can show it:

```csharp
using System;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

Type machine = typeof(Courier).GetNestedTypes(BindingFlags.NonPublic).Single();
Console.WriteLine(machine.Name);
Console.WriteLine($"struct: {machine.IsValueType}");
Console.WriteLine($"state machine: {typeof(IAsyncStateMachine).IsAssignableFrom(machine)}");
foreach (FieldInfo field in machine.GetFields(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).OrderBy(f => f.Name))
    Console.WriteLine($"  {field.FieldType.Name} {field.Name}");

static class Courier
{
    public static async Task<int> DeliverAsync(string address)
    {
        int stops = address.Length;
        await Task.Delay(10);
        return stops;
    }
}
```

```text
<DeliverAsync>d__0
struct: True
state machine: True
  Int32 <>1__state
  AsyncTaskMethodBuilder`1 <>t__builder
  TaskAwaiter <>u__1
  Int32 <stops>5__2
  String address
```

`DeliverAsync` becomes a stub: create the struct, copy `address` in, start it, return `builder.Task`. Starting calls `MoveNext`, which runs your code up to the first `await` and asks the awaiter `IsCompleted`. If yes, it carries on. If no, it saves the state and the awaiter, asks to be called back, and returns. Each later `MoveNext` jumps to the saved point. An exception in the body is caught by `MoveNext` and stored in the task, which is why it surfaces at the `await`, not at the call.

## Running work at the same time

A task starts running when you *call* the method, not when you await it. So independent operations overlap if you start them all first and await afterwards. `Task.WhenAll` gives you one task that completes when all of them have, with the results in argument order. `Task.WhenAny` completes when the first one does and hands you that task.

```csharp
var watch = Stopwatch.StartNew();
int a = await LoadAsync("orders", 300);
int b = await LoadAsync("stock", 300);
Console.WriteLine($"one after another: {a + b} rows, {watch.ElapsedMilliseconds >= 600}");

watch.Restart();
int[] rows = await Task.WhenAll(LoadAsync("orders", 300), LoadAsync("stock", 300));
Console.WriteLine($"together: {rows[0] + rows[1]} rows, {watch.ElapsedMilliseconds < 500}");

var primary = new TaskCompletionSource<string>();
var mirror = new TaskCompletionSource<string>();
Task<Task<string>> race = Task.WhenAny(primary.Task, mirror.Task);
mirror.SetResult("mirror");
Task<string> winner = await race;
Console.WriteLine($"{await winner} won; primary finished: {primary.Task.IsCompleted}");

static async Task<int> LoadAsync(string table, int milliseconds)
{
    await Task.Delay(milliseconds);
    return table.Length;
}
```

```text
one after another: 11 rows, True
together: 11 rows, True
mirror won; primary finished: False
```

(The file also needs `using System.Diagnostics;`.) The second pair takes about 300 ms instead of 600, because both delays run at once; on a heavily loaded machine the second `True` could become `False`. Notice the double `await` after `WhenAny`: the first gets the winning task, the second gets its value or rethrows its exception. The loser keeps running. `WhenAny` does not stop it; lesson 2 shows how.

## Async all the way

Once a method awaits, its callers should await it too: async **all the way** up to the entry point (`static async Task Main`, or top-level statements, which may use `await` directly). The shortcuts cause real bugs:

- `.Result`, `.Wait()` and `.GetAwaiter().GetResult()` **block** the thread until the task finishes, which wastes it. In apps with a *synchronization context*, such as a UI app that resumes awaits on the UI thread, the task may need the very thread you blocked, and the program **deadlocks**. `.Result` and `.Wait()` also wrap failures in an `AggregateException`.
- An `async void` method cannot be awaited, so the caller cannot know when it finishes or catch its exceptions, and an exception from it can crash the process. Use it only for event handlers, whose signature must be `void`.
- `Task.Run` moves CPU-heavy work to a thread-pool thread. Wrapping an I/O call in it makes nothing more asynchronous.

## `ValueTask` in one paragraph

`ValueTask<T>` is a struct that holds either a finished result or a task. It exists for methods that usually complete synchronously and are called very often, where allocating a `Task` each time would cost too much. It has strict rules: await it once only, never read `.Result` before it has completed, and call `AsTask()` if you need anything more, such as passing it to `WhenAll`. Microsoft's advice is to return `Task` by default and switch only when measurement shows the allocation matters.

## Common mistakes

- **Awaiting each call as soon as you make it** when the calls are independent. Start them all, then await.
- **Forgetting the `await`.** Inside an async method the compiler warns (`CS4014`): the work runs unobserved, and its exception is lost.
- **Blocking with `.Result` or `.Wait()`** in code that could await.
- **`async void` anywhere but an event handler.**

## Practice

1. In the first example, move `parcel.SetResult(7);` to before the call to `PrintLabelAsync`. What is printed now?
2. Change the "one after another" lines so that both loads run at the same time, without `Task.WhenAll`.
3. A button handler calls `string Read() => ReadFileAsync().Result;` and the app freezes. Explain why, and fix it.

### Answers

1. `1`, `3`, then `2. caller continues, label is RanToCompletion`, then `4`. The awaited task is already complete, so the method never suspends and finishes before it returns.
2. Start both, then await each:

   ```csharp
   Task<int> orders = LoadAsync("orders", 300);
   Task<int> stock = LoadAsync("stock", 300);
   int a = await orders;
   int b = await stock;
   ```

3. `.Result` blocks the UI thread. `ReadFileAsync` wants to resume on that same thread, which is waiting for it, so neither can proceed. Make the chain async: `async Task<string> ReadAsync() => await ReadFileAsync();`, and have the handler be `async void OnClick(...)` that awaits it.

## Key takeaways

- A `Task` represents work in progress and ends completed, faulted or canceled.
- An async method runs synchronously until it awaits an unfinished task, then returns an incomplete task to its caller.
- The compiler turns the method into a state machine struct that resumes at the saved point.
- Start independent tasks first, then combine them with `WhenAll` or `WhenAny`.
- Stay async all the way up; block only at the very top of a program that cannot await.

## Further reading

- [Microsoft Learn: Asynchronous programming with async and await](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)
- [Microsoft Learn: The task asynchronous programming model](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/task-asynchronous-programming-model)
- [Microsoft Learn: Async return types](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types)
- [.NET Blog, Stephen Toub: How async/await really works in C#](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/)
