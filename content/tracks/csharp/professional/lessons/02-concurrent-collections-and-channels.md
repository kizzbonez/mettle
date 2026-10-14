---
title: Concurrent Collections and Channels
summary: Share data between tasks with ConcurrentDictionary, hand work from producers to consumers with Channel<T>, and limit how much runs at once with SemaphoreSlim and Parallel.ForEachAsync.
minutes: 30
objectives:
  - Use `ConcurrentDictionary` safely, including the cases where its delegate overloads are not atomic
  - Build a producer and consumer pipeline with a bounded `Channel<T>` and explain back pressure
  - Throttle asynchronous work with `SemaphoreSlim` or `Parallel.ForEachAsync` and release slots correctly
---

## Outline

1. Why ordinary collections break
2. `ConcurrentDictionary`
3. Channels: producers and consumers
4. Throttling with `SemaphoreSlim`
5. `Parallel.ForEachAsync`

## Why ordinary collections break

`List<T>` and `Dictionary<TKey, TValue>` assume one thread at a time. Two threads adding to the
same dictionary can corrupt its internal arrays, and the failures are random: a lost entry, an
exception from deep inside the collection, or a dictionary that misbehaves from then on. You could wrap
every access in a `lock`, but `System.Collections.Concurrent` already offers collections built
for sharing: `ConcurrentDictionary`, `ConcurrentQueue` (first in, first out),
`ConcurrentStack`, and `ConcurrentBag` (unordered, cheap when each thread mostly consumes what
it added). Each single method call on them is thread-safe.

The catch is that a *sequence* of calls is not. `if (!dict.ContainsKey(k)) dict[k] = v;` is
still a race: another thread can add `k` between the check and the write. Use the methods that
do both steps in one call.

## `ConcurrentDictionary`

- `TryAdd`, `TryRemove`, `TryGetValue` and `TryUpdate(key, newValue, expectedOldValue)` are
  atomic and report whether they succeeded.
- `GetOrAdd(key, factory)` returns the existing value or adds a new one.
- `AddOrUpdate(key, addValue, updateFactory)` adds, or replaces the value with
  `updateFactory(key, old)`.

The delegate overloads have a documented trap: the dictionary calls your delegate **outside**
its internal lock, so that slow user code never blocks other threads. Two threads that miss the
same key can therefore both run the factory, and only one result is kept. That is harmless for
a cheap pure function and wrong for one that is expensive or has side effects. The usual fix
stores a `Lazy<T>`, whose own lock guarantees the expensive part runs once. (The examples in
this lesson need `using System.Collections.Concurrent;` and `using System.Threading.Channels;`.)

```csharp
string[] pages = ["/home", "/cart", "/home", "/checkout", "/home", "/cart"];
var views = new ConcurrentDictionary<string, int>();
await Parallel.ForEachAsync(Enumerable.Range(0, 1_000), async (i, ct) =>
{
    views.AddOrUpdate(pages[i % pages.Length], 1, (_, old) => old + 1);
    await Task.Yield();
});
foreach (var (page, count) in views.OrderBy(p => p.Key))
    Console.WriteLine($"{page,-10} {count}");

int loads = 0;
var templates = new ConcurrentDictionary<string, Lazy<string>>();
string Load(string name) { Interlocked.Increment(ref loads); return $"<{name}>"; }
await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Task.Run(() =>
    templates.GetOrAdd("invoice", name => new Lazy<string>(() => Load(name))).Value)));
Console.WriteLine($"template loaded {loads} time(s)");
```

```text
/cart      333
/checkout  167
/home      500
template loaded 1 time(s)
```

Enumerating a `ConcurrentDictionary` while others write is safe, but it is not a snapshot: you
may or may not see changes made after enumeration started. Call `ToArray()` when you need a
consistent copy.

## Channels: producers and consumers

A **producer and consumer** design separates the code that creates work from the code that does
it, with a queue in between. The `System.Threading.Channels` namespace, part of .NET, provides
that queue for async code. A
`Channel<T>` has a `Writer` and a `Reader`. A **bounded** channel holds at most a fixed number of
items; when it is full, `WriteAsync` waits (the default `FullMode`), or the channel drops the
newest, the oldest or the item being written. Making a fast producer wait for a slow consumer is
called **back pressure**, and it is what stops memory from growing without limit. An
**unbounded** channel never makes writers wait, so it is only safe when you know the producer is
slower than the consumer.

```csharp
var orders = Channel.CreateBounded<int>(new BoundedChannelOptions(capacity: 4)
{
    FullMode = BoundedChannelFullMode.Wait,   // the default: the writer waits
    SingleWriter = true,                      // promises that let the channel skip work
});

async Task ProduceAsync()
{
    for (int id = 1; id <= 20; id++)
        await orders.Writer.WriteAsync(id);   // waits while 4 are queued
    orders.Writer.Complete();                 // no more items: readers can finish
}

async Task<int> ConsumeAsync()
{
    int handled = 0;
    await foreach (int id in orders.Reader.ReadAllAsync())
    {
        await Task.Delay(1);                  // pretend to pack the order
        handled++;
    }
    return handled;
}

Task producer = ProduceAsync();
Task<int>[] consumers = [ConsumeAsync(), ConsumeAsync()];
await producer;
Console.WriteLine($"orders handled: {(await Task.WhenAll(consumers)).Sum()}");
```

```text
orders handled: 20
```

`Complete()` matters: `ReadAllAsync` ends only when the channel is completed and empty. With
several producers, call it once, after all of them have finished.

## Throttling with `SemaphoreSlim`

A **semaphore** holds a number of slots. `WaitAsync()` takes one, waiting asynchronously while
none is free, and `Release()` gives one back. Unlike a lock it has no **thread affinity**: any
thread may release, which is what makes it usable across `await`. `SemaphoreSlim(1, 1)` is the
async replacement for `lock`. With a larger count it **throttles**, which you need because
`Task.WhenAll` over a thousand calls starts all thousand at once, and a remote service or a
connection pool will not thank you for it.

```csharp
using var slots = new SemaphoreSlim(initialCount: 3);
int inFlight = 0, most = 0;
object counters = new();

async Task CallSupplierAsync(int sku)
{
    await slots.WaitAsync();
    try
    {
        lock (counters) most = Math.Max(most, ++inFlight);
        await Task.Delay(20);                 // the remote call
        lock (counters) inFlight--;
    }
    finally
    {
        slots.Release();                      // always give the slot back
    }
}

await Task.WhenAll(Enumerable.Range(1, 10).Select(CallSupplierAsync));
Console.WriteLine($"semaphore: most calls at once = {most}");
```

```text
semaphore: most calls at once = 3
```

Release in `finally`: a call that throws and skips `Release` loses the slot for good, and after
three failures nothing runs. Releasing more often than you waited throws
`SemaphoreFullException` once the count would pass its maximum.

## `Parallel.ForEachAsync`

`Parallel.ForEachAsync(source, options, body)` runs an async body for every item with at most
`MaxDegreeOfParallelism` bodies in progress. It hands each body a `CancellationToken`, stops
starting new items when the token is cancelled or a body throws, and rethrows after the running
ones finish. Without options the limit is `Environment.ProcessorCount`, which suits CPU work
but is usually wrong for I/O, so set it. Replacing the semaphore code above with
`new ParallelOptions { MaxDegreeOfParallelism = 3 }` printed the same `3` here. For CPU-bound
work with no `await`, `Parallel.ForEach` is the synchronous sibling.

## Common mistakes

- `ContainsKey` followed by an indexer write on a shared dictionary.
- Expensive or side-effecting `GetOrAdd` factories without `Lazy<T>`.
- An unbounded channel in front of a slow consumer.
- Forgetting `Writer.Complete()`, so consumers wait forever.
- `Release()` outside `finally`, or `Task.WhenAll` over thousands of unthrottled calls.

## Practice

1. Rewrite `if (!cache.ContainsKey(id)) cache[id] = Load(id); return cache[id];` for a
   `ConcurrentDictionary` so that `Load` runs at most once per id.
2. A sensor writes readings every millisecond and a database writer can only store one every
   five. Which channel options would you choose if losing old readings is acceptable?
3. What happens to the semaphore example if `Task.Delay` throws and `Release` is not in
   `finally`?

### Answers

1. Store `Lazy<T>`:
   `return cache.GetOrAdd(id, key => new Lazy<Item>(() => Load(key))).Value;`. Several `Lazy`
   wrappers may be created, but only the stored one's `Value` is read, so `Load` runs once.
2. `Channel.CreateBounded<Reading>(new BoundedChannelOptions(1_000) { FullMode = BoundedChannelFullMode.DropOldest })`:
   memory stays bounded and the newest readings survive.
3. Each failure leaks a slot. After three, `WaitAsync` never completes and every later call
   hangs.

## Key takeaways

- Concurrent collections make single calls safe; combine steps with `GetOrAdd`, `AddOrUpdate`
  and the `Try` methods.
- `GetOrAdd` and `AddOrUpdate` delegates may run more than once.
- Bounded channels give back pressure; complete the writer when production ends.
- Throttle I/O with `SemaphoreSlim` (release in `finally`) or `Parallel.ForEachAsync`.

## Further reading

- [Channels in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/channels)
- [Add and remove items from a ConcurrentDictionary](https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/how-to-add-and-remove-items)
- [Semaphore and SemaphoreSlim](https://learn.microsoft.com/en-us/dotnet/standard/threading/semaphore-and-semaphoreslim)
- [Parallel.ForEachAsync](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel.foreachasync)
