// A wrong async stream can wait for ever, so each one is read inside a task
// that is given three seconds before the test gives up.
async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// 1. A reading every 15 minutes from 6:00, which is minute 360.
Check.SequenceEqual(Station.SampleTimes(360, 15).Take(4), [360, 375, 390, 405], "the first four sample times from minute 360, every 15 minutes");
Check.Throws<ArgumentOutOfRangeException>(() => Station.SampleTimes(360, 0), "SampleTimes with every 0 minutes, at the call");

// 2. Temperatures up to the first missed reading.
Check.SequenceEqual(Station.UntilGap([4, 3, null, 5]), [4, 3], "the readings before the first gap");

// 3. The radio.
var feed = new Queue<string>(["wind 40 km/h", "snow from 9", "OVER", "not for us"]);
var heard = new List<string>();
async Task Listen()
{
    await foreach (string message in Station.ListenAsync(token => Task.FromResult(feed.Dequeue())))
        heard.Add(message);
}
Task listening = Listen();
await Settle(listening, "ListenAsync ends at the message OVER");
await listening;
Check.SequenceEqual(heard, ["wind 40 km/h", "snow from 9"], "the messages heard before OVER");
Check.Equal(feed.Count, 1, "the messages left in the feed after OVER");

// The warden switches the radio off after the first message.
using var off = new CancellationTokenSource();
var news = new Queue<string>(["wind 40 km/h", "snow from 9", "OVER"]);
Task<string> Receive(CancellationToken token)
{
    token.ThrowIfCancellationRequested();
    return Task.FromResult(news.Dequeue());
}
async Task ListenUntilOff()
{
    await foreach (string message in Station.ListenAsync(Receive).WithCancellation(off.Token))
        off.Cancel();
}
Task switchedOff = ListenUntilOff();
await Settle(switchedOff, "ListenAsync ends when the radio is switched off");
await Check.ThrowsAsync<OperationCanceledException>(() => switchedOff, "a token attached with WithCancellation reaches receive");
Check.Equal(news.Count, 2, "the messages left in the feed after the radio was switched off");
