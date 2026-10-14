async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// Stop is pressed during the third of five containers.
using var stop = new CancellationTokenSource();
var lifted = new List<string>();
Task<int> unload = Harbour.UnloadAsync(["K1", "K2", "K3", "K4", "K5"], (container, token) =>
{
    lifted.Add(container);
    if (container == "K3") stop.Cancel();
    return Task.CompletedTask;
}, stop.Token);
await Settle(unload, "UnloadAsync finishes after Stop is pressed");
Check.SequenceEqual(lifted, ["K1", "K2", "K3"], "the container in the air is finished and no other is started");
Check.True(unload.IsCanceled, "a stopped unload ends in the Canceled state, not with a result");
try
{
    await unload;
}
catch (OperationCanceledException e)
{
    Check.True(e.CancellationToken == stop.Token, "the OperationCanceledException names the caller's token");
}

// Stop was pressed before the first container.
using var early = new CancellationTokenSource();
early.Cancel();
lifted.Clear();
Task<int> never = Harbour.UnloadAsync(["L1", "L2"], (container, token) =>
{
    lifted.Add(container);
    return Task.CompletedTask;
}, early.Token);
await Settle(never, "UnloadAsync finishes when Stop was pressed before it started");
Check.Equal(lifted.Count, 0, "no container is lifted when Stop was pressed before the first one");
Check.True(never.IsCanceled, "an unload stopped before it started ends in the Canceled state");

// Stop is pressed during the last container: the job is already done.
using var last = new CancellationTokenSource();
lifted.Clear();
Task<int> done = Harbour.UnloadAsync(["M1", "M2"], (container, token) =>
{
    lifted.Add(container);
    if (container == "M2") last.Cancel();
    return Task.CompletedTask;
}, last.Token);
await Settle(done, "UnloadAsync finishes when Stop comes during the last container");
Check.True(done.Status == TaskStatus.RanToCompletion, "the token is checked before each container, not after the last one");
Check.Equal(await done, 2, "the number of containers lifted when Stop came during the last one");

// A lift that is waiting for the wind to drop, and listens to its token.
using var gale = new CancellationTokenSource();
lifted.Clear();
async Task WaitForCalm(string container, CancellationToken token)
{
    lifted.Add(container);
    if (container == "N2") await Task.Delay(Timeout.Infinite, token);
}
Task<int> windy = Harbour.UnloadAsync(["N1", "N2", "N3"], WaitForCalm, gale.Token);
Check.True(!windy.IsCompleted, "UnloadAsync is still waiting while a lift waits for the wind");
gale.Cancel();
await Settle(windy, "a lift that is waiting stops when Stop is pressed: the token must reach it");
Check.True(windy.IsCanceled, "an unload stopped during a waiting lift ends in the Canceled state");
Check.SequenceEqual(lifted, ["N1", "N2"], "no container is started after the waiting lift was stopped");
