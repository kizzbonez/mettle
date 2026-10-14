async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// Reads a whole stream, attaching `attach` with WithCancellation when one is given.
async Task<List<string>> Collect(IAsyncEnumerable<string> stream, string what, CancellationToken attach = default)
{
    var heard = new List<string>();
    async Task Read()
    {
        await foreach (string message in stream.WithCancellation(attach))
            heard.Add(message);
    }
    Task reading = Read();
    await Settle(reading, what);
    await reading;
    return heard;
}

// A radio that answers at once, and counts how often it was asked.
int asked = 0;
var tokens = new List<CancellationToken>();
Func<CancellationToken, Task<string>> Radio(params string[] messages)
{
    var queue = new Queue<string>(messages);
    return token =>
    {
        asked++;
        tokens.Add(token);
        return Task.FromResult(queue.Dequeue());
    };
}

// Nothing is received before the stream is read.
IAsyncEnumerable<string> stream = Station.ListenAsync(Radio("fog", "OVER"));
Check.Equal(asked, 0, "receive is not called before the stream is read");
List<string> heard = await Collect(stream, "ListenAsync ends at OVER");
Check.SequenceEqual(heard, ["fog"], "the messages before OVER");
Check.Equal(asked, 2, "receive is called once for each message, OVER included, and not after it");

// OVER only counts when it is the whole message.
asked = 0;
heard = await Collect(Station.ListenAsync(Radio("OVERCAST", "over", "OVER")), "ListenAsync ends at OVER");
Check.SequenceEqual(heard, ["OVERCAST", "over"], "messages that are not exactly OVER are yielded");
heard = await Collect(Station.ListenAsync(Radio("OVER", "late news")), "ListenAsync ends at OVER");
Check.Equal(heard.Count, 0, "OVER as the first message gives an empty stream");

// The caller stops reading early.
asked = 0;
await foreach (string message in Station.ListenAsync(Radio("one", "two", "three", "OVER")))
    if (message == "two") break;
Check.Equal(asked, 2, "receive is not called again after the caller stops reading");

// A token passed as the argument reaches receive.
using var argument = new CancellationTokenSource();
tokens.Clear();
await Collect(Station.ListenAsync(Radio("hail", "OVER"), argument.Token), "ListenAsync ends at OVER");
Check.True(tokens.Count == 2 && tokens.All(token => token == argument.Token), "a token passed as the argument reaches every receive");

// A token attached with WithCancellation reaches receive too.
using var attached = new CancellationTokenSource();
tokens.Clear();
await Collect(Station.ListenAsync(Radio("hail", "OVER")), "ListenAsync ends at OVER", attach: attached.Token);
Check.True(tokens.Count == 2 && tokens.All(token => token == attached.Token), "a token attached with WithCancellation reaches every receive");

// The warden switches off a radio that is waiting for its next message.
using var off = new CancellationTokenSource();
var received = new List<string>();
async Task<string> Waiting(CancellationToken token)
{
    if (received.Count == 0) return "first";
    await Task.Delay(Timeout.Infinite, token);
    return "never";
}
async Task Listen()
{
    await foreach (string message in Station.ListenAsync(Waiting).WithCancellation(off.Token))
        received.Add(message);
}
Task listening = Listen();
Check.True(!listening.IsCompleted, "the stream waits while the radio has no message");
off.Cancel();
await Settle(listening, "switching the radio off stops a receive that is waiting: the token must reach it");
await Check.ThrowsAsync<OperationCanceledException>(() => listening, "the cancellation comes out of await foreach");
Check.SequenceEqual(received, ["first"], "the messages heard before the radio was switched off");
