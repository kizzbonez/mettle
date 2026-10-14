`Ping` and the rules are written, and so is `Before`, the code production runs today. It is
correct. Leave it as it is and use it to compare your results.

Write the three methods of `Surge`. They return exactly what the `Before` versions return.
**No test measures time.** What is checked is how many bytes a call allocates on the managed
heap.

1. `int CountInZone(Ping[] pings, int zone)` counts the pings whose `Zone` is `zone`. It
   allocates **nothing**. The lambda in `Before.CountInZone` captures `zone`, so every call
   creates a closure object and a delegate before LINQ even starts.
2. `int[] DriversInZone(Ping[] pings, int zone)` returns the `DriverId` of every ping from
   `zone`, in the order of the input. It allocates **only the array it returns**, at its final
   size: no list that grows, no copy. A zone with no pings may return an empty array.
3. `CountWhere` counts the pings that a rule matches. It allocates **nothing**, also when the
   rule is a struct such as `SlowerThan`. In the starter it takes an `IPingRule`, and passing a
   struct to that parameter boxes it at every call. Change it to this signature:

   ```csharp
   public static int CountWhere<TRule>(Ping[] pings, TRule rule) where TRule : IPingRule
   ```

   Callers do not change: `Surge.CountWhere(pings, new SlowerThan(10))` still compiles, and
   `TRule` is now `SlowerThan` itself.

How the counting works: each test calls your method a few times first, so that compiling it is
not counted, and then reads `GC.GetAllocatedBytesForCurrentThread()` before and after a call.

Example:

```csharp
Ping[] pings = [new(101, Zone: 3, Kmh: 40), new(102, 7, 5), new(103, 3, 0), new(104, 3, 22)];

Surge.CountInZone(pings, 3)                    // 3, and 0 bytes allocated
Surge.DriversInZone(pings, 3)                  // [101, 103, 104]: the bytes of one int[3]
Surge.CountWhere(pings, new SlowerThan(10))    // 2 (drivers 102 and 103), and 0 bytes
Surge.CountWhere(pings, new InZone(7))         // 1, and 0 bytes
```

**Tips**

- A `foreach` over an array allocates nothing. A `foreach` over an `IEnumerable<T>` usually
  allocates an enumerator.
- To size the array once, count first and fill second. Two passes over a few thousand structs
  cost far less than the garbage a growing list leaves behind.
- Inside a generic method constrained to an interface, `rule.Matches(ping)` calls the struct's
  method directly, without boxing it.
