// The queue: bounded, waiting instead of dropping, and completed by the producer.
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

static async Task<List<string>> ReadAll(System.Threading.Channels.ChannelReader<Upload> reader)
{
    var ids = new List<string>();
    await foreach (Upload upload in reader.ReadAllAsync()) ids.Add(upload.Id);
    return ids;
}

Upload[] ten = Enumerable.Range(1, 10).Select(i => new Upload($"ep-{i}", i * 10)).ToArray();
string[] tenIds = ten.Select(upload => upload.Id).ToArray();

int[] capacities = [1, 3, 5];
foreach (int capacity in capacities)
{
    var queue = Transcoder.CreateQueue(capacity);
    Task producing = Transcoder.ProduceAsync(queue.Writer, ten);
    Check.True(!producing.IsCompleted, "the producer waits while the queue is full and uploads are left");
    Check.Equal(queue.Reader.Count, capacity, "uploads waiting in a full queue, compared with its capacity");

    List<string> read = await Result(ReadAll(queue.Reader),
        "reading a queue ends once the producer has written everything and completed the writer");
    Check.SequenceEqual(read, tenIds, "every upload comes out of the queue once, in the order it was written");
    await Finishes(producing, "the producer finishes once its uploads have been read");
}

// Room for everything: all ten wait in the queue, and the writer is completed.
var roomy = Transcoder.CreateQueue(20);
await Finishes(Transcoder.ProduceAsync(roomy.Writer, ten), "a producer with room for every upload finishes");
Check.Equal(roomy.Reader.Count, 10, "uploads waiting in a queue with room for all of them");
Check.True(!roomy.Writer.TryWrite(new Upload("late", 5)), "the producer completes the writer after the last upload");
Check.SequenceEqual(await Result(ReadAll(roomy.Reader), "reading a completed queue ends"), tenIds,
    "the uploads read from a queue with room for all of them");

// Nothing to write.
var empty = Transcoder.CreateQueue(2);
await Finishes(Transcoder.ProduceAsync(empty.Writer, []), "a producer with no uploads finishes");
await Finishes(empty.Reader.Completion, "the queue of a producer with no uploads is completed");

Check.Throws<ArgumentOutOfRangeException>(() => Transcoder.CreateQueue(0), "a queue with a capacity of 0");
Check.Throws<ArgumentOutOfRangeException>(() => Transcoder.CreateQueue(-4), "a queue with a negative capacity");
