async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// Plates that are not ready yet.
var log = new List<string>();
var plates = new TaskCompletionSource<string[]>();
Task<string> served = Kitchen.ServeAsync("table 7", plates.Task, log);
Check.SequenceEqual(log.ToArray(), ["table 7: waiting"], "the code before the first await runs at the call");
Check.True(!served.IsCompleted, "an async method returns an unfinished task when it awaits an unfinished one");
plates.SetResult(["bread", "soup", "fish"]);
Check.Equal(await Finish(served, "ServeAsync finishes once the plates are ready"), "table 7 served", "what ServeAsync returns");
Check.SequenceEqual(log, ["table 7: waiting", "table 7: 3 plates"], "the second line is added once the plates are ready");

// Plates that are ready before the call: the method never has to wait.
var quick = new List<string>();
Task<string> atOnce = Kitchen.ServeAsync("bar 2", Task.FromResult(new[] { "olives" }), quick);
Check.True(atOnce.IsCompleted, "awaiting a finished task does not suspend, so the whole method runs at the call");
Check.SequenceEqual(quick.ToArray(),["bar 2: waiting", "bar 2: 1 plates"], "both lines are added at the call when the plates are ready");
Check.Equal(await atOnce, "bar 2 served", "what ServeAsync returns for plates that were ready");

// Two tables share one log, and the second table's plates come first.
var shared = new List<string>();
var slow = new TaskCompletionSource<string[]>();
var fast = new TaskCompletionSource<string[]>();
Task<string> one = Kitchen.ServeAsync("table 1", slow.Task, shared);
Task<string> two = Kitchen.ServeAsync("table 2", fast.Task, shared);
fast.SetResult([]);
await Finish(two, "ServeAsync finishes once its own plates are ready");
slow.SetResult(["steak"]);
await Finish(one, "ServeAsync finishes once its own plates are ready");
Check.SequenceEqual(
    shared,
    ["table 1: waiting", "table 2: waiting", "table 2: 0 plates", "table 1: 1 plates"],
    "each table logs when it is called and again when its own plates are ready");
