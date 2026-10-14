Write the three methods of the static class `Station`. The first two are iterators
(`yield return`), the third is an async stream.

1. `SampleTimes(int firstMinute, int everyMinutes)` returns `IEnumerable<int>`: the minutes of
   the day at which readings are taken, `firstMinute`, `firstMinute + everyMinutes`, and so on.
   - The sequence never ends. It is lazy: it computes only what the caller asks for.
   - If `everyMinutes` is less than 1, throw `ArgumentOutOfRangeException` **at the call**, not
     later when someone enumerates the result.
2. `UntilGap(IEnumerable<int?> readings)` returns `IEnumerable<int>`: the readings in order, up to
   (and not including) the first `null`, which marks a missed reading. Then the sequence ends.
   - Read the source lazily: one reading for each item the caller asks for, nothing before the
     caller starts, and nothing after the gap.
3. `ListenAsync(Func<CancellationToken, Task<string>> receive, CancellationToken cancellationToken
   = default)` returns `IAsyncEnumerable<string>`.
   - Await `receive(cancellationToken)` for each message and yield it, until a message is exactly
     `"OVER"`. Do not yield `"OVER"`, and do not call `receive` again after it.
   - A token passed as the argument **or** attached with `.WithCancellation(token)` must reach
     `receive`. Mark the parameter with `[EnumeratorCancellation]` (the starter already has
     `using System.Runtime.CompilerServices;`).

Example:

```csharp
// 1. A reading every 15 minutes from 6:00, which is minute 360.
Station.SampleTimes(360, 15).Take(4)        // [360, 375, 390, 405]
Station.SampleTimes(360, 0)                 // throws ArgumentOutOfRangeException at once

// 2. Temperatures up to the first missed reading.
Station.UntilGap([4, 3, null, 5])           // [4, 3]

// 3. The radio.
var feed = new Queue<string>(["wind 40 km/h", "snow from 9", "OVER", "not for us"]);
var heard = new List<string>();
await foreach (string message in Station.ListenAsync(token => Task.FromResult(feed.Dequeue())))
    heard.Add(message);
heard                                       // ["wind 40 km/h", "snow from 9"]
feed.Count                                  // 1: nothing was received after "OVER"

// The warden switches the radio off after the first message.
using var off = new CancellationTokenSource();
var news = new Queue<string>(["wind 40 km/h", "snow from 9", "OVER"]);
Task<string> Receive(CancellationToken token)
{
    token.ThrowIfCancellationRequested();
    return Task.FromResult(news.Dequeue());
}
await foreach (string message in Station.ListenAsync(Receive).WithCancellation(off.Token))
    off.Cancel();                           // the next receive throws OperationCanceledException
news.Count                                  // 2
```

**Tip:** an iterator method runs none of its body until it is enumerated, argument checks
included. Check the argument in an ordinary method, then return a local iterator function.
