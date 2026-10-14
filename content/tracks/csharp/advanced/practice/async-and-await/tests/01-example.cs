// A wrong answer can leave a task waiting for ever, so every await below gives
// up after three seconds and says what it was waiting for.
async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// 1. Three stations, all cooking at once.
var stations = new Dictionary<string, TaskCompletionSource<string>>();
Task<string> Cook(string dish)
{
    var plate = new TaskCompletionSource<string>();
    stations[dish] = plate;
    return plate.Task;
}
Task<string[]> table = Kitchen.CookTableAsync(["soup", "steak", "salad"], Cook);
Check.Equal(stations.Count, 3, "the number of dishes started before any of them was ready");
stations["salad"].SetResult("green salad");
stations["soup"].SetResult("pea soup");
stations["steak"].SetResult("steak frites");
string[] plates = await Finish(table, "CookTableAsync finishes once every dish is ready");
Check.SequenceEqual(plates, ["pea soup", "steak frites", "green salad"], "the plates of the table, in the order of the ticket");

// 2. Two couriers, and Bea answers first.
var ali = new TaskCompletionSource<string>();
var bea = new TaskCompletionSource<string>();
Task<string> courier = Kitchen.FirstCourierAsync([ali.Task, bea.Task]);
bea.SetResult("Bea");
string first = await Finish(courier, "FirstCourierAsync finishes when the first courier answers, without waiting for the other");
Check.Equal(first, "Bea", "the courier who answered first");

// 3. Table 4 waits for its plates.
var log = new List<string>();
var ready = new TaskCompletionSource<string[]>();
Task<string> served = Kitchen.ServeAsync("table 4", ready.Task, log);
Check.SequenceEqual(log.ToArray(), ["table 4: waiting"], "the log right after the call, while the plates are not ready");
Check.True(!served.IsCompleted, "ServeAsync is still waiting while the plates are not ready");
ready.SetResult(["pea soup", "steak frites"]);
string done = await Finish(served, "ServeAsync finishes once the plates are ready");
Check.Equal(done, "table 4 served", "what ServeAsync returns");
Check.SequenceEqual(log, ["table 4: waiting", "table 4: 2 plates"], "the log once the plates were ready");
