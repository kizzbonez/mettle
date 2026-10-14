// RunAsync: the given number of workers at once, never more, and every upload handled.
static async Task<T> Result<T>(Task<T> task, string what)
{
    Check.True(await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(3))) == task, what);
    return await task;
}

Upload[] twenty = Enumerable.Range(1, 20).Select(i => new Upload($"ep-{i}", i)).ToArray();

int[] workerCounts = [1, 3];
foreach (int workers in workerCounts)
{
    // Every transcode waits at a gate until the test opens it.
    var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var entered = new SemaphoreSlim(0);
    object counters = new();
    int inProgress = 0, most = 0;
    var transcoder = new Transcoder(async upload =>
    {
        lock (counters) most = Math.Max(most, ++inProgress);
        entered.Release();
        await gate.Task;
        lock (counters) inProgress--;
    });

    Task<int> run = transcoder.RunAsync(twenty, capacity: 2, workers);
    for (int i = 0; i < workers; i++)
        Check.True(await entered.WaitAsync(TimeSpan.FromSeconds(3)),
            $"each of the workers (workers: {workers}) is transcoding at the same time, with a queue of capacity 2");
    gate.SetResult();
    int total = await Result(run, "RunAsync finishes once the gate is open");

    Check.Equal(total, 20, $"uploads transcoded by RunAsync (workers: {workers})");
    Check.Equal(most, workers, $"the most transcodes in progress at once (workers: {workers})");
}

// Duplicates and a small queue.
var seen = new List<string>();
var counting = new Transcoder(upload =>
{
    lock (seen) seen.Add(upload.Id);
    return Task.CompletedTask;
});
Upload[] withCopies = [.. twenty, .. twenty.Take(5), .. twenty.Skip(15)];
Check.Equal(await Result(counting.RunAsync(withCopies, capacity: 1, workers: 2), "RunAsync with copies finishes"), 20,
    "uploads transcoded when ten of twenty episodes arrive twice");
Check.SequenceEqual(seen.Order(), twenty.Select(upload => upload.Id).Order(), "every episode is transcoded exactly once");

Check.Equal(await Result(new Transcoder(upload => Task.CompletedTask).RunAsync([], capacity: 3, workers: 2), "RunAsync with no uploads finishes"), 0,
    "uploads transcoded when there are none");

await Check.ThrowsAsync<ArgumentOutOfRangeException>(() => counting.RunAsync(twenty, capacity: 2, workers: 0), "RunAsync with no workers");
