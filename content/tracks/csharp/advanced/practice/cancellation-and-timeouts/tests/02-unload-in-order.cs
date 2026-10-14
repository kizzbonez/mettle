async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// Each lift takes a moment: it starts, gives the thread back, and ends later.
var events = new List<string>();
var tokens = new List<CancellationToken>();
async Task Lift(string container, CancellationToken token)
{
    lock (events)
    {
        events.Add($"start {container}");
        tokens.Add(token);
    }
    await Task.Yield();
    lock (events) events.Add($"end {container}");
}

using var shift = new CancellationTokenSource();
int count = await Finish(
    Harbour.UnloadAsync(["A1", "B2", "C3", "D4"], Lift, shift.Token),
    "UnloadAsync finishes when every lift has finished");
Check.Equal(count, 4, "the number of containers lifted");
Check.SequenceEqual(
    events,
    ["start A1", "end A1", "start B2", "end B2", "start C3", "end C3", "start D4", "end D4"],
    "one container at a time, in order: each lift ends before the next one starts");
Check.True(tokens.Count == 4 && tokens.All(token => token == shift.Token), "every lift receives the caller's token");

// No token at all.
events.Clear();
tokens.Clear();
int quiet = await Finish(Harbour.UnloadAsync(["E5", "F6"], Lift), "UnloadAsync finishes without a token");
Check.Equal(quiet, 2, "the number of containers lifted when no token is given");
Check.True(tokens.All(token => !token.CanBeCanceled), "without a token, the lifts receive the default token");

// The same container name twice, and an empty ship.
events.Clear();
int twice = await Finish(Harbour.UnloadAsync(["G7", "G7"], Lift, shift.Token), "UnloadAsync finishes for two containers");
Check.Equal(twice, 2, "every entry of the list is lifted, even with the same name");
events.Clear();
int none = await Finish(Harbour.UnloadAsync([], Lift, shift.Token), "UnloadAsync finishes for an empty ship");
Check.Equal(none, 0, "the number of containers lifted from an empty ship");
Check.Equal(events.Count, 0, "nothing is lifted from an empty ship");
