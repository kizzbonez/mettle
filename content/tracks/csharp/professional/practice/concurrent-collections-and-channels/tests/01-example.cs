// The example from the instructions.

// Awaits a task, but gives up with a failed check after a few seconds.
static async Task<T> Result<T>(Task<T> task, string what)
{
    Check.True(await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(3))) == task, what);
    return await task;
}

var transcoded = new List<string>();
var transcoder = new Transcoder(upload =>
{
    lock (transcoded) transcoded.Add(upload.Id);
    return Task.CompletedTask;
});

var queue = Transcoder.CreateQueue(capacity: 2);
Task producing = Transcoder.ProduceAsync(queue.Writer, [new("ep-1", 30), new("ep-2", 45), new("ep-3", 20)]);
Check.True(!producing.IsCompleted, "the producer waits while a queue of capacity 2 is full and a third upload is left");
Check.Equal(queue.Reader.Count, 2, "uploads waiting in a full queue of capacity 2");

int handled = await Result(transcoder.ConsumeAsync(queue.Reader), "a worker finishes once the writer is completed and the queue is empty");
Check.Equal(handled, 3, "uploads transcoded by the only worker");
Check.True(await Task.WhenAny(producing, Task.Delay(TimeSpan.FromSeconds(3))) == producing, "the producer finishes once the worker has made room");
Check.SequenceEqual(transcoded, ["ep-1", "ep-2", "ep-3"], "uploads transcoded by one worker, in order");

var again = new Transcoder(upload => Task.CompletedTask);
int total = await Result(again.RunAsync([new("ep-7", 50), new("ep-8", 10), new("ep-7", 50)], capacity: 2, workers: 2),
    "RunAsync finishes once every upload has been handled");
Check.Equal(total, 2, "uploads transcoded by RunAsync when ep-7 is uploaded twice");
