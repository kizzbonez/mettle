Complete `ReadingException` and write the three methods of the static class `Meters`.

1. `ReadingException` derives from `Exception`. Give it the **three standard constructors**: one
   with no parameters, one taking a `string message`, and one taking a `string message` and an
   `Exception inner`, each passing its arguments on to `Exception`. `Line` is already there.
2. `Meters.Total(IReadOnlyList<string> lines)` returns `int`. Every line looks like
   `M-104:2231`: a meter name, a colon, and a whole number. Return the sum of the numbers, read
   with `int.Parse` from the text after the colon (0 for no lines).
   - When `int.Parse` throws a `FormatException`, throw a `ReadingException` instead (any
     message) with `Line` set to the number of the bad line, **counting from 1**, and the
     `FormatException` as its inner exception.
3. `Meters.Watched(Action action, List<string> log)` runs `action`.
   - If it throws, add `"failed: {message of the exception}"` to `log` from an **exception
     filter that returns `false`**. Nothing is caught: the same exception object goes on to the
     caller of `Watched`, and the log line is written before any `finally` block inside `action`
     runs.
   - If `action` succeeds, add nothing.
4. `Meters.SumAsync(IReadOnlyList<Task<int>> readings)` returns `Task<int>`.
   - If `readings` is `null`, throw `ArgumentNullException` **at the call**, not from the
     returned task.
   - Otherwise await every reading and return the sum (0 for an empty list).
   - If one or more readings failed, the returned task fails with an `AggregateException` whose
     `InnerExceptions` are **every** failure, in the order of the list.

Example:

```csharp
Meters.Total(["M-101:120", "M-102:80"])          // 200
Meters.Total(["M-101:120", "M-102:eighty"])      // throws ReadingException with Line 2 and a
                                                 // FormatException as its InnerException
var log = new List<string>();
try
{
    Meters.Watched(() =>
    {
        try { throw new InvalidOperationException("valve stuck"); }
        finally { log.Add("valve closed"); }
    }, log);
}
catch (InvalidOperationException) { }
log                                              // ["failed: valve stuck", "valve closed"]

await Meters.SumAsync([Task.FromResult(5), Task.FromResult(7)])   // 12
Meters.SumAsync(null!)                           // throws ArgumentNullException at once

Task<int> north = Task.FromException<int>(new IOException("north van offline"));
Task<int> south = Task.FromException<int>(new IOException("south van offline"));
await Meters.SumAsync([north, Task.FromResult(3), south])
                                                 // throws AggregateException holding both
                                                 // IOExceptions, north first
```

**Tips:** validate in an ordinary method and put the awaiting in a local `async` function. A
plain `await` of `Task.WhenAll` rethrows only the first failure; the task it returns keeps all of
them in its `Exception` property.
