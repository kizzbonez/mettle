Write the four methods of `Measure`.

1. `double Median(IReadOnlyList<long> samples)` returns the middle value of the samples in
   sorted order. With an even number of samples it is the mean of the two middle values. It
   does **not change the input**: an array passed in keeps its order. No samples throws
   `ArgumentException`.
2. `long[] Time(Action work, int warmups, int samples, Func<long> clock)` takes timing samples.
   - First it calls `work` `warmups` times **without reading the clock**.
   - Then, once per sample: read `clock()`, call `work()`, read `clock()` again. The sample is
     the second reading minus the first.
   - It returns the samples in the order they were taken, and reads the clock exactly twice
     per sample and at no other time.
   - A negative `warmups` or a `samples` below 1 throws `ArgumentOutOfRangeException`.
3. `long AllocatedBy(Action work)` calls `work` once to warm it up, then returns the bytes that
   **one more call** allocates on the current thread, read with
   `GC.GetAllocatedBytesForCurrentThread()` before and after it. `work` is called exactly
   twice.
4. `long WithinBudget(string name, Action work, long budget)` turns that count into a
   regression test. It measures `work` with `AllocatedBy`. If the bytes are more than `budget`,
   it throws `InvalidOperationException` with exactly this message:

   ```text
   <name> allocated <bytes> B, budget <budget> B
   ```

   Otherwise it returns the bytes. A count equal to the budget is within it.

The clock is a parameter so that the tests can hand in a fake one and know every reading in
advance. Production passes `Stopwatch.GetTimestamp`. **No test measures real time**; the
allocation counts are exact.

Example:

```csharp
// A fake clock: work moves it forward. The first call is slow, as a first call is.
long now = 0;
int calls = 0;
void Work() { calls++; now += calls == 1 ? 900 : 10 + calls; }

Measure.Time(Work, warmups: 1, samples: 3, () => now)   // [12, 13, 14]: the slow call was a warm-up
Measure.Median([12, 13, 14])                            // 13
Measure.Median([5, 1, 4, 2])                            // 3: the mean of 2 and 4

object? sink = null;
Measure.AllocatedBy(() => sink = new byte[1000])        // 1024: 1,000 bytes and the array's 24-byte header
Measure.WithinBudget("export line", () => sink = new byte[1000], budget: 2000)   // 1024
Measure.WithinBudget("export line", () => sink = new byte[1000], budget: 1000)
    // throws InvalidOperationException: "export line allocated 1024 B, budget 1000 B"
```

**Tips**

- `samples.Order().ToArray()` gives a sorted copy and leaves the input alone; `Array.Sort`
  would sort the caller's array.
- Two `long` values near the top of their range overflow when added; converting one of them
  to `double` first avoids that.
- The warm-up call in `AllocatedBy` is what keeps first-call costs, such as a cache filled on
  first use, out of the count.
