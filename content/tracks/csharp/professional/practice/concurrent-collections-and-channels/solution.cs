// Episode Queue
//
// Uploaded podcast episodes wait in a bounded channel until a transcoding
// worker is free. The bound makes the uploader wait when the workers fall
// behind, and the workers share one dictionary so that an episode uploaded
// twice is transcoded once.

using System.Collections.Concurrent;
using System.Threading.Channels;

/// <summary>An uploaded episode waiting to be transcoded.</summary>
public sealed record Upload(string Id, int Minutes);

/// <summary>Transcodes uploads with the given function, from as many workers as you start.</summary>
public sealed class Transcoder(Func<Upload, Task> transcode)
{
    // The ids some worker has taken. TryAdd checks and marks in one atomic step.
    private readonly ConcurrentDictionary<string, byte> _taken = new();

    /// <summary>A queue that holds at most <paramref name="capacity"/> uploads; a writer waits while it is full.</summary>
    public static Channel<Upload> CreateQueue(int capacity)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(capacity, 1);
        return Channel.CreateBounded<Upload>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,   // the default, written out: the writer waits
        });
    }

    /// <summary>Writes every upload in order, then completes the writer.</summary>
    public static async Task ProduceAsync(ChannelWriter<Upload> writer, IEnumerable<Upload> uploads)
    {
        try
        {
            foreach (Upload upload in uploads)
                await writer.WriteAsync(upload);   // waits while the queue is full
        }
        finally
        {
            writer.Complete();                     // readers can finish
        }
    }

    /// <summary>One worker: reads until the queue is completed and empty. Returns how many it transcoded.</summary>
    public async Task<int> ConsumeAsync(ChannelReader<Upload> reader)
    {
        int transcoded = 0;
        await foreach (Upload upload in reader.ReadAllAsync())
        {
            // Marked before the work starts, so a copy that arrives while the
            // first is still being transcoded is skipped as well.
            if (!_taken.TryAdd(upload.Id, 0)) continue;
            await transcode(upload);
            transcoded++;
        }
        return transcoded;
    }

    /// <summary>Queues the uploads and transcodes them with <paramref name="workers"/> workers. Returns the total transcoded.</summary>
    public async Task<int> RunAsync(IEnumerable<Upload> uploads, int capacity, int workers)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(workers, 1);
        Channel<Upload> queue = CreateQueue(capacity);

        // The workers start first: a producer awaited alone would wait forever
        // on a full queue that nobody reads.
        Task<int>[] consumers = Enumerable.Range(0, workers).Select(_ => ConsumeAsync(queue.Reader)).ToArray();
        await ProduceAsync(queue.Writer, uploads);
        int[] counts = await Task.WhenAll(consumers);
        return counts.Sum();
    }
}
