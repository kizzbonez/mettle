---
title: Memory and the Garbage Collector
summary: Learn where .NET puts your objects, what the garbage collector does with them, what allocates without you noticing, and why finalizers are a last resort.
minutes: 30
objectives:
  - Describe the managed heap, roots, generations and the large object heap, and predict an object's generation
  - Identify the code patterns that allocate, including boxing, closures and LINQ, and measure them
  - Weigh struct against class for memory and copying cost
  - Explain the cost and limits of finalizers and prefer `IDisposable` and `SafeHandle`
---

## Outline

1. Stack, heap and the managed heap
2. What allocates
3. Generations
4. The large object heap
5. Struct or class
6. Finalization
7. Settings you will meet

## Stack, heap and the managed heap

Each thread has a **stack**: a block of memory for the local variables and arguments of the
methods it is running, freed automatically when a method returns. Instances of reference types
(classes, arrays, strings, delegates, boxed values) live on the **managed heap**, a region the
runtime reserves for the process. A value type is stored wherever its variable is: a local
`int` on the stack, an `int` field inside the object that contains it, the elements of an
`int[]` inside the array.

Allocating on the managed heap is fast: the runtime keeps a pointer to the next free address
and moves it forward by the object's size. The cost comes later. When enough has been
allocated, the **garbage collector** (GC) runs. It starts from the **roots** (static fields,
local variables on every thread's stack, CPU registers, GC handles), marks every object it can
reach from them, and treats everything else as garbage. It then **compacts** the survivors,
moving them together and updating every reference to them. While it does this, other managed
threads are suspended. Fewer allocations mean fewer and shorter collections.

## What allocates

`GC.GetAllocatedBytesForCurrentThread()` returns how many bytes the current thread has
allocated on the managed heap so far, so the difference before and after a piece of code is its
allocation:

```csharp
static long AllocatedBy(Action work)
{
    work();                                    // once first: JIT and static setup are not counted
    long before = GC.GetAllocatedBytesForCurrentThread();
    work();
    return GC.GetAllocatedBytesForCurrentThread() - before;
}

int total = 0;
object? sink = null;
int[] numbers = Enumerable.Range(1, 100).ToArray();

Console.WriteLine($"struct PointS : {AllocatedBy(() => { var p = new PointS(1, 2); total += p.X; })} B");
Console.WriteLine($"class PointC  : {AllocatedBy(() => { sink = new PointC(1, 2); })} B");
Console.WriteLine($"box an int    : {AllocatedBy(() => { sink = (object)42; })} B");
Console.WriteLine($"PointS[1000]  : {AllocatedBy(() => { sink = new PointS[1000]; })} B");
Console.WriteLine($"1000 PointC   : {AllocatedBy(() => { var a = new PointC[1000]; for (int i = 0; i < a.Length; i++) a[i] = new PointC(i, i); sink = a; })} B");
Console.WriteLine($"for loop sum  : {AllocatedBy(() => { int s = 0; foreach (int n in numbers) s += n; total += s; })} B");
Console.WriteLine($"LINQ Where+Sum: {AllocatedBy(() => { total += numbers.Where(n => n > total % 50).Sum(); })} B");

readonly record struct PointS(int X, int Y);
sealed record PointC(int X, int Y);
```

```text
struct PointS : 0 B
class PointC  : 24 B
box an int    : 24 B
PointS[1000]  : 8024 B
1000 PointC   : 32024 B
for loop sum  : 0 B
LINQ Where+Sum: 48 B
```

These are the numbers from this course's 64-bit sandbox. A small object costs at least 24
bytes, because every object carries a header and a pointer to its type besides its fields.
Patterns that allocate where you might not expect it:

- **Boxing**: a value type converted to `object` or to an interface it implements is copied
  into a new heap object.
- **Closures**: a lambda that captures a local variable gets a compiler-generated object to
  hold it, and usually a new delegate.
- **LINQ**: each operator creates an iterator object, and lambdas add delegates.
- **Strings**: every `+`, `Substring`, `ToString()` and interpolated string is a new object.
- **`params` arrays, `async` methods that do not complete synchronously, and growing
  collections**, which allocate a bigger array and copy.

## Generations

Most objects die young: a request's temporary objects are garbage when the request ends. The GC
exploits this with **generations**. New objects start in **generation 0**, which is collected
often and cheaply. Objects that survive a collection are **promoted** to generation 1, and
survivors of that to **generation 2**, which holds long-lived data and is collected rarely.
Collecting a generation also collects the younger ones, so a gen 2 collection is a **full
collection**.

```csharp
var order = new byte[100];
Console.WriteLine($"new object          : gen {GC.GetGeneration(order)}");
GC.Collect();
Console.WriteLine($"after 1 collection  : gen {GC.GetGeneration(order)}");
GC.Collect();
Console.WriteLine($"after 2 collections : gen {GC.GetGeneration(order)}");
Console.WriteLine($"byte[80_000]        : gen {GC.GetGeneration(new byte[80_000])}");
Console.WriteLine($"byte[90_000]        : gen {GC.GetGeneration(new byte[90_000])}");
```

```text
new object          : gen 0
after 1 collection  : gen 1
after 2 collections : gen 2
byte[80_000]        : gen 0
byte[90_000]        : gen 2
```

The expensive objects are those that live just long enough to reach gen 2, such as a cache entry
kept for a minute: only a full collection can reclaim them.

## The large object heap

Objects of 85,000 bytes or more go to the **large object heap** (LOH). It is logically part of
generation 2, so a large object is born "old" and freed only by a full collection, as the
`byte[90_000]` above shows. Copying large objects is costly, so the LOH is normally swept into
a free list instead of compacted, which can leave gaps. Every new object's memory is cleared
first, and for large arrays that clearing dominates the allocation cost. Microsoft's advice
follows: reuse large buffers from a pool instead of allocating temporary ones (lesson 4 shows
`ArrayPool<T>`).

## Struct or class

A `struct` is not automatically cheaper. It avoids a heap allocation and a header, and an array
of structs is one contiguous block (8,024 bytes above against 32,024 for objects). But a struct
is copied on every assignment and every pass by value, so a large struct passed around a lot
costs more than a reference. Boxing it, or storing it behind an interface, brings the
allocation back. Prefer small, immutable `readonly struct` types for values such as points,
money and ids, pass large ones with `in`, and keep classes for things with identity or shared
state.

## Finalization

A **finalizer** (`~TempFile()` in C#) runs when the GC finds an object unreachable. Doing so
takes extra work: such objects are registered when created, survive the collection that finds
them dead, wait for the **finalizer thread** to run their finalizer, and are reclaimed only by a
later collection.

```csharp
using System.Runtime.CompilerServices;

WeakReference tracker = CreateAndForget();
GC.Collect();                      // finds it unreachable and queues the finalizer
GC.WaitForPendingFinalizers();     // the finalizer thread runs ~TempFile
Console.WriteLine($"alive after 1st collection: {tracker.IsAlive}");
GC.Collect();                      // now the memory can be reclaimed
Console.WriteLine($"alive after 2nd collection: {tracker.IsAlive}");

[MethodImpl(MethodImplOptions.NoInlining)]
static WeakReference CreateAndForget() => new(new TempFile(), trackResurrection: true);

sealed class TempFile
{
    ~TempFile() => Console.WriteLine("finalizer ran");
}
```

```text
finalizer ran
alive after 1st collection: True
alive after 2nd collection: False
```

A `WeakReference` observes an object without keeping it alive. Finalizers run at an unknown
time, on an unspecified thread, in no guaranteed order, and an exception in one ends the
process. Release resources with `IDisposable` and `using` instead (Advanced level), wrap
operating system handles in a `SafeHandle`, and call `GC.SuppressFinalize(this)` in `Dispose`
when a class does have a finalizer.

## Settings you will meet

**Workstation GC** is the default for standalone apps and is always used on a machine with one
logical CPU. **Server GC** gives each logical CPU its own heap and GC thread for throughput;
hosts such as ASP.NET Core choose their own default. **Background GC** lets gen 2 collections
run while your threads keep working. Leave `GC.Collect()` to tests and diagnostics like the ones
above: the GC tunes its own timing, and forcing collections usually makes things slower.

## Common mistakes

- Treating allocation as free because each one is fast; the bill comes as collections.
- Boxing in hot paths: `object` parameters, non-generic collections, structs behind interfaces.
- Large temporary arrays in a loop, each one a large object.
- Finalizers on classes that hold only managed objects, or `GC.Collect()` in production code.

## Practice

1. Which of these allocate on the heap: `int x = 5;`, `object o = 5;`,
   `Func<int> f = () => x;`, `Span<int> s = stackalloc int[4];`?
2. A service keeps a `List<Order>` of the last 20,000 orders and replaces it every minute. Why
   might that cause gen 2 collections, and what would you change?
3. A class wraps a native file handle in an `IntPtr` field and has no finalizer. What happens if
   a caller forgets `Dispose`?

### Answers

1. `object o = 5;` (boxing) and the lambda (a closure object for `x` plus a delegate). The `int`
   local and the `stackalloc` buffer live on the stack.
2. Each list lives about a minute, long enough to be promoted to gen 2, then becomes garbage
   that only a full collection reclaims. Its backing array of 20,000 references (8 bytes each
   on 64-bit) is over 85,000 bytes, so it even starts on the LOH. Reuse one list (`Clear()`
   keeps its capacity) or keep a fixed-size ring buffer.
3. The handle leaks until the process ends: the GC frees the object's memory but knows nothing
   about the native handle. Wrap it in a `SafeHandle`, which has a reliable finalizer.

## Key takeaways

- Allocation is a pointer bump; collection is the cost, and it grows with what survives.
- Gen 0 is cheap, gen 2 and the large object heap are expensive.
- Boxing, closures, LINQ and strings allocate; measure with `GC.GetAllocatedBytesForCurrentThread`.
- Small immutable structs save allocations; large or boxed ones do not.
- Finalizers delay reclamation; prefer `IDisposable` and `SafeHandle`.

## Further reading

- [Fundamentals of garbage collection](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals)
- [The large object heap](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/large-object-heap)
- [Object.Finalize: how finalization works](https://learn.microsoft.com/en-us/dotnet/fundamentals/runtime-libraries/system-object-finalize)
- [GC.GetAllocatedBytesForCurrentThread](https://learn.microsoft.com/en-us/dotnet/api/system.gc.getallocatedbytesforcurrentthread)
