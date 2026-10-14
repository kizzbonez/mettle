Write the two methods of the static class `Harbour`. Both are `async` methods: add the `async`
keyword when you write their bodies.

1. `UnloadAsync(IReadOnlyList<string> containers, Func<string, CancellationToken, Task> lift,
   CancellationToken cancellationToken = default)` returns `Task<int>`.
   - Lift the containers one at a time, in order: await `lift(container, cancellationToken)`
     before you start the next one. Pass the token on to every lift.
   - **Before** each container, check the token with `ThrowIfCancellationRequested()`. A stopped
     unload then ends with an `OperationCanceledException`, and its task is `Canceled`. Do not
     check after the last container: once every container is off the ship, the job is done.
   - Return the number of containers lifted.
2. `AskWithDeadlineAsync(Func<CancellationToken, Task<string>> ask, TimeSpan limit,
   CancellationToken cancellationToken = default)` returns `Task<string>`.
   - Create a source linked to `cancellationToken`, start its countdown with `CancelAfter(limit)`,
     and pass **its** token to `ask`. Dispose the source when you are done with it.
   - Return the answer of `ask`.
   - If `ask` ends with an `OperationCanceledException` while the caller's token is **not**
     canceled, the deadline has passed: throw a `TimeoutException` instead (any message).
   - If the caller's token was canceled, let the `OperationCanceledException` come out as it is.
   - Any other exception from `ask` comes out unchanged.

Example:

```csharp
// 1. The harbour master presses Stop while the second container is in the air.
using var stop = new CancellationTokenSource();
var lifted = new List<string>();
Task Lift(string container, CancellationToken token)
{
    lifted.Add(container);
    if (container == "C2") stop.Cancel();
    return Task.CompletedTask;
}
Task<int> unload = Harbour.UnloadAsync(["C1", "C2", "C3"], Lift, stop.Token);
await unload                    // throws OperationCanceledException
lifted                          // ["C1", "C2"]: C2 was finished, C3 never started
unload.Status                   // TaskStatus.Canceled

await Harbour.UnloadAsync(["C1", "C2"], (container, token) => Task.CompletedTask)   // 2

// 2. A berth request with a deadline.
await Harbour.AskWithDeadlineAsync(token => Task.FromResult("berth 7"), TimeSpan.FromSeconds(30))
                                // "berth 7"

async Task<string> NoAnswer(CancellationToken token)
{
    await Task.Delay(Timeout.Infinite, token);   // the office never answers
    return "never";
}
await Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromMilliseconds(50))
                                // throws TimeoutException

using var giveUp = new CancellationTokenSource();
giveUp.Cancel();
await Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromSeconds(30), giveUp.Token)
                                // throws OperationCanceledException: the caller gave up
```

**Tip:** an exception filter, `catch (OperationCanceledException) when (...)`, lets the caller's
own cancellation pass through untouched. `Task.WaitAsync(limit)` is no substitute for the linked
source: it stops your waiting but never tells `ask` to stop.
