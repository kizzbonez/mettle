// Every delivery waits at a gate that opens once three are in progress.
var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
var entered = new SemaphoreSlim(0);
var counterLock = new object();
int inProgress = 0, most = 0;
var gateway = new DelegateGateway(async (batch, ct) =>
{
    lock (counterLock) { inProgress++; most = Math.Max(most, inProgress); }
    entered.Release();
    await gate.Task;
    lock (counterLock) inProgress--;
});
var relay = new MeterRelay(gateway, new RelaySettings(MaxConcurrency: 3, MaxAttempts: 1));
MeterBatch[] batches = Enumerable.Range(1, 8).Select(i => new MeterBatch($"B{i}", [])).ToArray();

Task<RelayReport> run = relay.RelayAsync(batches);
for (int i = 0; i < 3; i++)
    Check.True(await entered.WaitAsync(TimeSpan.FromSeconds(3)), "three deliveries can be in progress at the same time");
gate.SetResult();
RelayReport report = await run;

Check.Equal(most, 3, "the most deliveries in progress at once with MaxConcurrency 3");
Check.Equal(report.Delivered, 8, "batches delivered");
Check.Equal(report.Attempts, 8, "calls made to the gateway");

// A cancelled token stops the relay before anything is sent.
int calls = 0;
var counting = new MeterRelay(
    new DelegateGateway((batch, ct) => { Interlocked.Increment(ref calls); return Task.CompletedTask; }),
    new RelaySettings(MaxConcurrency: 2, MaxAttempts: 1));
using var cancelled = new CancellationTokenSource();
cancelled.Cancel();
await Check.ThrowsAsync<OperationCanceledException>(
    () => counting.RelayAsync(batches, cancelled.Token),
    "RelayAsync with a cancelled token throws OperationCanceledException");
Check.Equal(calls, 0, "gateway calls made with a cancelled token");
