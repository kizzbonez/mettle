`Upload` and the constructor of `Transcoder` are written: the constructor takes `transcode`, the
function that does the slow work for one upload. Write the four members.

1. `static Channel<Upload> CreateQueue(int capacity)` returns a **bounded** channel that holds
   at most `capacity` uploads. When it is full, a writer **waits** for room: nothing is
   dropped. A `capacity` below 1 throws `ArgumentOutOfRangeException`.
2. `static async Task ProduceAsync(ChannelWriter<Upload> writer, IEnumerable<Upload> uploads)`
   writes every upload, in order, and then completes the writer so that readers can finish.
3. `async Task<int> ConsumeAsync(ChannelReader<Upload> reader)` is one worker. It reads uploads
   until the channel is completed and empty, and awaits `transcode(upload)` for each one.
   - An episode is sometimes uploaded twice, with the same `Id`. Only the first copy that **any
     worker of this `Transcoder`** takes is transcoded; a later copy is skipped.
   - Mark an `Id` as taken **before** you start transcoding it: a copy that arrives while the
     first one is still being transcoded is skipped too.
   - It returns how many uploads this call transcoded.
4. `async Task<int> RunAsync(IEnumerable<Upload> uploads, int capacity, int workers)` creates a
   queue with `CreateQueue(capacity)`, runs `workers` calls of `ConsumeAsync` on it at the same
   time as `ProduceAsync`, and returns the total that the workers transcoded. A `workers` below
   1 throws `ArgumentOutOfRangeException`.

The tests control when each `transcode` call finishes, so they can see how many uploads wait in
the queue, whether the producer is waiting, and how many workers are busy at once.

Example:

```csharp
var transcoded = new List<string>();
var transcoder = new Transcoder(upload => { transcoded.Add(upload.Id); return Task.CompletedTask; });

var queue = Transcoder.CreateQueue(capacity: 2);
Task producing = Transcoder.ProduceAsync(queue.Writer, [new("ep-1", 30), new("ep-2", 45), new("ep-3", 20)]);
producing.IsCompleted                       // false: ep-3 waits for room
queue.Reader.Count                          // 2
await transcoder.ConsumeAsync(queue.Reader) // 3, once the writer is completed
transcoded                                  // ["ep-1", "ep-2", "ep-3"]

var again = new Transcoder(upload => Task.CompletedTask);
await again.RunAsync([new("ep-7", 50), new("ep-8", 10), new("ep-7", 50)], capacity: 2, workers: 2)   // 2
```

**Tips**

- `Channel.CreateBounded<Upload>(new BoundedChannelOptions(capacity) { ... })`. `WriteAsync`
  waits while the channel is full; `Complete()` tells readers that nothing more is coming.
- `await foreach (Upload upload in reader.ReadAllAsync())` ends when the channel is completed
  and empty.
- `ContainsKey` followed by a write is a race between two workers. `ConcurrentDictionary.TryAdd`
  checks and adds in one call.
- In `RunAsync`, start the workers before you await the producer. A producer awaited on its own
  waits forever once the queue is full and nobody reads it.
