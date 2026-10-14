// Workers share what has been taken, and an id is taken before the work starts.
static async Task<T> Result<T>(Task<T> task, string what)
{
    Check.True(await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(3))) == task, what);
    return await task;
}

static async Task Finishes(Task task, string what)
{
    Check.True(await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(3))) == task, what);
    await task;
}

// The first transcode of ep-7 waits at a gate the test opens later.
var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
var calls = new List<string>();
bool holdNextEp7 = true;
var transcoder = new Transcoder(upload =>
{
    lock (calls) calls.Add(upload.Id);
    if (upload.Id == "ep-7" && holdNextEp7)
    {
        holdNextEp7 = false;
        return gate.Task;
    }
    return Task.CompletedTask;
});

var queue = Transcoder.CreateQueue(10);
await Finishes(Transcoder.ProduceAsync(queue.Writer, [new("ep-7", 50), new("ep-7", 50), new("ep-8", 10)]),
    "a producer with room for its three uploads finishes");

Task<int> first = transcoder.ConsumeAsync(queue.Reader);
Check.True(!first.IsCompleted, "a worker whose transcode has not finished is still busy");
int bySecond = await Result(transcoder.ConsumeAsync(queue.Reader),
    "a second worker finishes the rest of the queue while the first is still transcoding");
gate.SetResult();
int byFirst = await Result(first, "the first worker finishes once its transcode is done");

Check.Equal((byFirst, bySecond), (1, 1),
    "uploads transcoded by each worker when a copy of ep-7 arrives while the first copy is being transcoded");
Check.SequenceEqual(calls, ["ep-7", "ep-8"], "transcode calls when ep-7 was taken by one worker and its copy read by another");

// Each Transcoder keeps its own record of what has been taken.
var other = new Transcoder(upload => Task.CompletedTask);
var later = Transcoder.CreateQueue(4);
await Finishes(Transcoder.ProduceAsync(later.Writer, [new("ep-7", 50)]), "a producer with one upload finishes");
Check.Equal(await Result(other.ConsumeAsync(later.Reader), "a worker of another Transcoder finishes"), 1,
    "a Transcoder that has never seen ep-7 transcodes it");

// Three workers, 300 uploads of 120 different episodes.
var counts = new Dictionary<string, int>();
var busy = new Transcoder(async upload =>
{
    lock (counts) counts[upload.Id] = counts.GetValueOrDefault(upload.Id) + 1;
    await Task.Yield();
});
var big = Transcoder.CreateQueue(8);
Task producing = Transcoder.ProduceAsync(big.Writer, Enumerable.Range(0, 300).Select(i => new Upload($"ep-{i % 120}", i)));
Task<int[]> workers = Task.WhenAll(busy.ConsumeAsync(big.Reader), busy.ConsumeAsync(big.Reader), busy.ConsumeAsync(big.Reader));
int[] perWorker = await Result(workers, "three workers finish 300 uploads");
await Finishes(producing, "the producer of 300 uploads finishes");
Check.Equal(perWorker.Sum(), 120, "uploads transcoded by three workers, 300 uploads of 120 different episodes");
Check.Equal(counts.Count, 120, "different episodes transcoded");
Check.True(counts.Values.All(n => n == 1), "every episode is transcoded exactly once");
