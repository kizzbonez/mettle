async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// A kitchen whose stations finish only when this test says so. A list, not a
// dictionary, so that the same dish can be ordered twice.
var started = new List<(string Dish, TaskCompletionSource<string> Plate)>();
Task<string> Cook(string dish)
{
    var plate = new TaskCompletionSource<string>();
    started.Add((dish, plate));
    return plate.Task;
}

// Five dishes, two of them the same.
string[] ticket = ["bread", "soup", "fish", "soup", "tart"];
Task<string[]> table = Kitchen.CookTableAsync(ticket, Cook);
Check.Equal(started.Count, 5, "every dish is started before any of them is ready");
Check.SequenceEqual(started.Select(s => s.Dish), ticket, "cook is called once for each dish, in the order of the ticket");
Check.True(!table.IsCompleted, "CookTableAsync is not finished while the dishes are cooking");

// The stations finish back to front.
for (int i = started.Count - 1; i >= 0; i--)
{
    started[i].Plate.SetResult($"{started[i].Dish} #{i + 1}");
    if (i > 0) Check.True(!table.IsCompleted, "CookTableAsync waits until the last dish is ready");
}
string[] plates = await Finish(table, "CookTableAsync finishes once every dish is ready");
Check.SequenceEqual(
    plates,
    ["bread #1", "soup #2", "fish #3", "soup #4", "tart #5"],
    "the plates follow the order of the ticket, whatever order they were ready in");
Check.Equal(started.Count, 5, "cook is called exactly once for each dish");

// Dishes that are ready at once.
started.Clear();
string[] quick = await Finish(
    Kitchen.CookTableAsync(["tea", "toast"], dish => Task.FromResult(dish.ToUpperInvariant())),
    "CookTableAsync finishes when every dish was ready at once");
Check.SequenceEqual(quick, ["TEA", "TOAST"], "the plates of dishes that were ready at once");

// An empty ticket.
string[] none = await Finish(Kitchen.CookTableAsync([], Cook), "CookTableAsync finishes for an empty ticket");
Check.Equal(none.Length, 0, "the number of plates for an empty ticket");
Check.Equal(started.Count, 0, "cook is not called for an empty ticket");
