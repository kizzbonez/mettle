// Episode Queue
//
// Uploaded podcast episodes wait in a bounded channel until a transcoding
// worker is free. The bound makes the uploader wait when the workers fall
// behind, and the workers share one dictionary so that an episode uploaded
// twice is transcoded once.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

using System.Collections.Concurrent;
using System.Threading.Channels;

/// <summary>An uploaded episode waiting to be transcoded.</summary>
public sealed record Upload(string Id, int Minutes);

/// <summary>Transcodes uploads with the given function, from as many workers as you start.</summary>
public sealed class Transcoder(Func<Upload, Task> transcode)
{
    // TODO: a field, shared by every worker of this Transcoder, that remembers
    //       which ids have been taken.

    /// <summary>A queue that holds at most <paramref name="capacity"/> uploads; a writer waits while it is full.</summary>
    public static Channel<Upload> CreateQueue(int capacity)
    {
        throw new NotImplementedException();
    }

    /// <summary>Writes every upload in order, then completes the writer.</summary>
    public static async Task ProduceAsync(ChannelWriter<Upload> writer, IEnumerable<Upload> uploads)
    {
        throw new NotImplementedException();
    }

    /// <summary>One worker: reads until the queue is completed and empty. Returns how many it transcoded.</summary>
    public async Task<int> ConsumeAsync(ChannelReader<Upload> reader)
    {
        // TODO: call `transcode` for each upload whose id no worker has taken yet.
        throw new NotImplementedException();
    }

    /// <summary>Queues the uploads and transcodes them with <paramref name="workers"/> workers. Returns the total transcoded.</summary>
    public async Task<int> RunAsync(IEnumerable<Upload> uploads, int capacity, int workers)
    {
        throw new NotImplementedException();
    }
}
