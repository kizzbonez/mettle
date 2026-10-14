Write the three methods of the static class `Kitchen`. Each one is an `async` method: add the
`async` keyword when you write its body. Nothing in this lab waits for time to pass: the tests
hand you tasks from a `TaskCompletionSource` and complete them when they choose. Never block on
a task with `.Result` or `.Wait()`.

1. `CookTableAsync(IReadOnlyList<string> dishes, Func<string, Task<string>> cook)` returns
   `Task<string[]>`.
   - Call `cook` once for every dish, and call it for **all** of them before you await any, so
     that the stations work at the same time.
   - Return the plates (the results of `cook`) in the order of `dishes`, whatever order they are
     ready in. With no dishes, return an empty array.
2. `FirstCourierAsync(IReadOnlyList<Task<string>> couriers)` returns `Task<string>`.
   - Each task completes with a courier's name when that courier accepts the job.
   - Return the name from the first task to complete, as soon as it completes. Do not wait for
     the others.
   - If the first task to complete failed, its exception comes out of `FirstCourierAsync`
     unchanged.
3. `ServeAsync(string table, Task<string[]> plates, List<string> log)` returns `Task<string>`.
   - Straight away, before you await anything, add `"{table}: waiting"` to `log`.
   - Then await `plates`, add `"{table}: {number of plates} plates"` to `log` and return
     `"{table} served"`.

Example:

```csharp
// 1. Three stations, all cooking at once.
var stations = new Dictionary<string, TaskCompletionSource<string>>();
Task<string> Cook(string dish)
{
    var plate = new TaskCompletionSource<string>();
    stations[dish] = plate;
    return plate.Task;
}
Task<string[]> table = Kitchen.CookTableAsync(["soup", "steak", "salad"], Cook);
stations.Count                                // 3: every dish was started before any was ready
stations["salad"].SetResult("green salad");
stations["soup"].SetResult("pea soup");
stations["steak"].SetResult("steak frites");
await table                                   // ["pea soup", "steak frites", "green salad"]

// 2. Two couriers, and Bea answers first.
var ali = new TaskCompletionSource<string>();
var bea = new TaskCompletionSource<string>();
Task<string> courier = Kitchen.FirstCourierAsync([ali.Task, bea.Task]);
bea.SetResult("Bea");
await courier                                 // "Bea", although Ali has not answered yet

// 3. Table 4 waits for its plates.
var log = new List<string>();
var plates = new TaskCompletionSource<string[]>();
Task<string> served = Kitchen.ServeAsync("table 4", plates.Task, log);
log                                           // ["table 4: waiting"], and served is not complete
plates.SetResult(["pea soup", "steak frites"]);
await served                                  // "table 4 served"
log                                           // ["table 4: waiting", "table 4: 2 plates"]
```

**Tip:** `Task.WhenAll` gives the results in the order of the tasks you pass it. After
`Task.WhenAny` you need a second `await`: the first one gives you the winning task, the second
gives its value or rethrows its exception.
