// Settings are checked when the relay is built.
var quiet = new DelegateGateway((batch, ct) => Task.CompletedTask);
Check.Throws<ArgumentOutOfRangeException>(() => new MeterRelay(quiet, new RelaySettings(0, 3)), "a MaxConcurrency of 0 is refused");
Check.Throws<ArgumentOutOfRangeException>(() => new MeterRelay(quiet, new RelaySettings(2, 0)), "a MaxAttempts of 0 is refused");

// Transient failures are retried up to MaxAttempts calls in total; other failures are not retried.
var calls = new Dictionary<string, int>();
var callsLock = new object();
var gateway = new DelegateGateway((batch, ct) =>
{
    int attempt;
    lock (callsLock) { calls[batch.Id] = attempt = calls.GetValueOrDefault(batch.Id) + 1; }
    return batch.Id switch
    {
        "flaky" when attempt < 3 => Task.FromException(new TransientGatewayException("busy")),
        "down" => Task.FromException(new TransientGatewayException("busy")),
        "bad" => throw new InvalidOperationException("schema rejected"),
        _ => Task.CompletedTask,
    };
});
var relay = new MeterRelay(gateway, new RelaySettings(MaxConcurrency: 2, MaxAttempts: 3));
MeterBatch[] batches = [new("ok", []), new("flaky", []), new("down", []), new("bad", [])];

RelayReport report = await relay.RelayAsync(batches);

Check.Equal(calls.GetValueOrDefault("ok"), 1, "calls for a batch that succeeds at once");
Check.Equal(calls.GetValueOrDefault("flaky"), 3, "calls for a batch that succeeds on its third attempt");
Check.Equal(calls.GetValueOrDefault("down"), 3, "calls for a batch that always fails transiently");
Check.Equal(calls.GetValueOrDefault("bad"), 1, "calls for a batch that fails with a non-transient error");
Check.Equal(report.Delivered, 2, "batches delivered");
Check.SequenceEqual(report.FailedBatchIds, ["bad", "down"], "failed batch ids, in ordinal order");
Check.Equal(report.Attempts, 8, "calls made to the gateway, retries included");

// With MaxAttempts 1 nothing is retried.
int onceCalls = 0;
var once = new MeterRelay(
    new DelegateGateway((batch, ct) => { Interlocked.Increment(ref onceCalls); throw new TransientGatewayException("busy"); }),
    new RelaySettings(MaxConcurrency: 1, MaxAttempts: 1));
RelayReport onceReport = await once.RelayAsync([new MeterBatch("solo", [])]);
Check.Equal(onceCalls, 1, "calls when MaxAttempts is 1");
Check.SequenceEqual(onceReport.FailedBatchIds, ["solo"], "failed batch ids when MaxAttempts is 1");

// A failed batch must not stop the others, even with one delivery at a time.
var delivered = new List<string>();
var serial = new MeterRelay(
    new DelegateGateway((batch, ct) =>
    {
        if (batch.Id == "first") throw new InvalidOperationException("rejected");
        lock (delivered) delivered.Add(batch.Id);
        return Task.CompletedTask;
    }),
    new RelaySettings(MaxConcurrency: 1, MaxAttempts: 2));
Task<RelayReport> run = serial.RelayAsync(new[] { "first", "b", "c", "d", "e" }.Select(id => new MeterBatch(id, [])));
Check.True(await Task.WhenAny(run, Task.Delay(3_000)) == run, "the relay finishes after a batch fails with MaxConcurrency 1");
RelayReport serialReport = await run;
Check.Equal(serialReport.Delivered, 4, "batches delivered after the first one failed");
Check.SequenceEqual(delivered.Order(), ["b", "c", "d", "e"], "batches that reached the gateway after the failure");
