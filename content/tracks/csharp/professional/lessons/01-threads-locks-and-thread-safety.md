---
title: Threads, Locks and Thread Safety
summary: See why shared state breaks when several threads touch it, and protect it with the lock statement, the Lock type, Monitor, Interlocked and a fixed lock order.
minutes: 30
objectives:
  - Explain a race condition and a lost update, and show why `count++` is not atomic
  - Protect shared state with `lock` on a private `System.Threading.Lock` and say what the statement compiles to
  - Choose between `lock`, `Monitor.TryEnter`, `Interlocked` and `volatile` for a given piece of shared state
  - Recognise a deadlock and prevent it with a consistent lock order or detect it with a timeout
---

## Outline

1. Threads and shared state
2. A race you can see
3. The `lock` statement and the `Lock` type
4. `Monitor`
5. `Interlocked`
6. `volatile` in plain terms
7. Deadlocks

## Threads and shared state

A **thread** is an independent path of execution inside a process. All threads of a process
share its memory: every static field, and every object more than one thread can reach. The
operating system can pause a thread between any two machine instructions and run another
(**preemption**), and on a machine with several cores threads truly run at the same instant.

You rarely create threads yourself. `Task.Run` queues work to the **thread pool**, a set of
threads the runtime reuses, and code after an `await` usually continues on a pool thread. So a
request handler, a timer callback and a background job can all touch the same object at once.
Code is **thread-safe** when it behaves correctly however those threads interleave.

## A race you can see

A **race condition** is a bug whose outcome depends on the timing of threads. The classic one
is `counter++`, which is three steps: read the value, add one, write it back. If two threads
both read 0 before either writes, both write 1 and one increment disappears: a **lost update**.
Real races appear rarely and at random, so this program forces the bad timing with a
`Barrier`, which holds each thread until both have read:

```csharp
int counter = 0;
using var bothHaveRead = new Barrier(participantCount: 2);

void IncrementSlowly()
{
    int seen = counter;            // 1. read
    bothHaveRead.SignalAndWait();  // wait until the other thread has read too
    counter = seen + 1;            // 2. write back
}

var first = new Thread(IncrementSlowly);
var second = new Thread(IncrementSlowly);
first.Start(); second.Start();
first.Join(); second.Join();
Console.WriteLine($"two increments, counter = {counter}");

var gate = new Lock();
int safeCounter = 0;
await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Task.Run(() =>
{
    for (int i = 0; i < 100_000; i++)
        lock (gate) { safeCounter++; }
})));
Console.WriteLine($"400,000 increments under a lock, counter = {safeCounter:N0}");
```

```text
two increments, counter = 1
400,000 increments under a lock, counter = 400,000
```

In the second half only one thread at a time can be inside `lock (gate)`, so each read and
write happen as one indivisible step and nothing is lost.

## The `lock` statement and the `Lock` type

`lock (x) { ... }` gives **mutual exclusion**: at most one thread runs any block guarded by the
same `x`. Such a block is a **critical section**. Since C# 13 and .NET 9, make `x` a dedicated
`System.Threading.Lock`. When the compiler sees that type it emits
`using (x.EnterScope()) { ... }`; for any other reference type it calls `Monitor.Enter` and
`Monitor.Exit` inside `try`/`finally`. Either way the lock is released when the block exits,
even through an exception. Rules that follow:

- **Lock a private readonly field that exists only for locking.** Never `this`, a `Type` or a
  string: other code can reach those objects and lock them too.
- **Keep its type `Lock`.** Converted to `object`, it falls back to `Monitor`, and the compiler
  reports `warning CS9216: A value of type 'System.Threading.Lock' converted to a different type
  will use likely unintended monitor-based locking`.
- **Never `await` inside.** A lock belongs to a thread, and code after `await` may resume on
  another one: `error CS1996: Cannot await in the body of a lock statement`. Async code uses
  `SemaphoreSlim`, covered in the next lesson.
- **Hold it briefly.** Every other thread that wants it waits. Do I/O outside.
- **Every access takes the same lock**, reads included. A lock protects only code that uses it.

A thread may enter a lock it already holds (locks are **reentrant**), as long as it exits as
many times as it entered.

## `Monitor`

`Monitor` is the class behind `lock` on an ordinary object. Two of its members are still
useful. `Monitor.TryEnter(obj, timeout)` gives up after the timeout and returns `false`, which
turns a silent hang into something you can log (`Lock.TryEnter(TimeSpan)` does the same).
`Monitor.Wait` and `Monitor.Pulse` let a thread sleep inside a lock until another signals it;
the types in the next lesson do that job with less room for error.

## `Interlocked`

For one variable, `System.Threading.Interlocked` performs a read-modify-write as a single
**atomic** operation, one that no other thread can see half done: `Increment`, `Add`,
`Exchange` and `CompareExchange`. It is cheaper than a lock and cannot deadlock.
`CompareExchange(ref x, value, expected)` writes only if `x` still equals `expected` and
returns what it found, so any update can be written as a retry loop:

```csharp
long requests = 0, slowest = 0;

void Record(long elapsedMs)
{
    Interlocked.Increment(ref requests);
    long current = Volatile.Read(ref slowest);
    while (elapsedMs > current)
    {
        long previous = Interlocked.CompareExchange(ref slowest, elapsedMs, current);
        if (previous == current) break;   // our value went in
        current = previous;               // another thread changed it: try again
    }
}

await Task.WhenAll(
    Task.Run(() => { for (int i = 1; i <= 50_000; i++) Record(i % 700); }),
    Task.Run(() => { for (int i = 1; i <= 50_000; i++) Record(i % 900); }));
Console.WriteLine($"requests={requests} slowest={slowest}");
```

```text
requests=100000 slowest=899
```

The trade-off: `Interlocked` covers one variable. When two fields must change together, such
as a balance and its history, use a lock.

## `volatile` in plain terms

The compiler, the JIT and the processor may reorder or cache reads and writes whenever a single
thread could not tell the difference. Another thread can. A `volatile` field forbids some of
those optimisations, so a loop such as `while (!_stop)` sees another thread's write instead of
a stale value. It does not make `count++` atomic and does not order other memory operations.
Microsoft's guidance is to prefer `lock`, `Interlocked`, `Volatile.Read` and `Volatile.Write`,
or a `CancellationToken` for the stop flag, and to keep `volatile` for rare expert code.

## Deadlocks

A **deadlock** happens when each of two threads holds a lock the other needs, so both wait
forever. Here a transfer locks `accounts` then `audit`, and a report takes them in the opposite
order. The barrier makes the bad timing certain, and `TryEnter` lets the program notice:

```csharp
object accounts = new(), audit = new();
using var bothHoldOne = new Barrier(2);
bool transferGotAudit = true, reportGotAccounts = true;

var transfer = new Thread(() =>
{
    lock (accounts)
    {
        bothHoldOne.SignalAndWait();
        transferGotAudit = Monitor.TryEnter(audit, TimeSpan.FromMilliseconds(200));
        if (transferGotAudit) Monitor.Exit(audit);
    }
});
var report = new Thread(() =>
{
    lock (audit)
    {
        bothHoldOne.SignalAndWait();
        reportGotAccounts = Monitor.TryEnter(accounts, TimeSpan.FromMilliseconds(200));
        if (reportGotAccounts) Monitor.Exit(accounts);
    }
});
transfer.Start(); report.Start();
transfer.Join(); report.Join();
Console.WriteLine($"transfer got audit: {transferGotAudit}, report got accounts: {reportGotAccounts}");
```

```text
transfer got audit: False, report got accounts: False
```

The cure is a **lock order**: every path that needs both takes `accounts` first. Also hold one
lock at a time where you can, and never call unknown code (events, callbacks) while holding one.

## Common mistakes

- Locking on `this`, `typeof(...)` or a string literal.
- Taking the lock to write a field but reading it without the lock.
- `Monitor.Enter` without a `finally` that calls `Monitor.Exit`.
- Two locks taken in different orders on different code paths.
- Believing `volatile` makes `++` atomic.

## Practice

1. `class Stats { public int Hits; public void Hit() => Hits++; }` is shared by request
   handlers. Make it thread-safe in two ways and say which you prefer.
2. Why does `lock (_gate) { await SaveAsync(); }` not compile, and what do you use instead?
3. Method A locks `_orders` then `_stock`. Method B locks `_stock` and then calls `Reserve()`,
   which locks `_orders`. Is there a deadlock risk, and how do you remove it?

### Answers

1. Make the field private. Then either call `Interlocked.Increment(ref _hits)` in `Hit` and read
   it with `Volatile.Read(ref _hits)`, or take a private `Lock` in `Hit` and in the getter.
   Prefer `Interlocked` for a lone counter: cheaper, and it cannot deadlock.
2. Error CS1996. A lock is owned by a thread, and the code after `await` may run on another
   thread. Use a `SemaphoreSlim(1, 1)`: `await WaitAsync()` before, `Release()` in `finally`.
3. Yes. A can hold `_orders` and wait for `_stock` while B holds `_stock` and waits for
   `_orders`. Make every path take `_orders` before `_stock`, or have B release `_stock`
   before it calls `Reserve`.

## Key takeaways

- State that two threads can reach needs protection; `x++` is a read, an add and a write.
- `lock` on a private `Lock` field is the default tool: short, and never around `await`.
- `Interlocked` for single variables; `volatile` only when you know exactly why.
- Deadlocks come from inconsistent lock order. Fix the order, and use timeouts to detect them.

## Further reading

- [C# reference: the lock statement](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/lock)
- [System.Threading.Lock class](https://learn.microsoft.com/en-us/dotnet/api/system.threading.lock)
- [Managed threading best practices](https://learn.microsoft.com/en-us/dotnet/standard/threading/managed-threading-best-practices)
- [C# reference: volatile](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/volatile)
