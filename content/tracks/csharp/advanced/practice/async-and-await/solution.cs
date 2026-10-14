// Kitchen Pass
//
// Three async methods for the pass of a restaurant kitchen: start every dish
// at once and wait for all of them, take the first courier who answers, and
// see where an async method stops and hands control back to its caller.

public static class Kitchen
{
    /// Cooks every dish at the same time and returns the plates in the order of the ticket.
    public static async Task<string[]> CookTableAsync(IReadOnlyList<string> dishes, Func<string, Task<string>> cook)
    {
        // A task starts when the method is called, so start them all first...
        var cooking = new List<Task<string>>();
        foreach (string dish in dishes)
            cooking.Add(cook(dish));

        // ...and await them together. WhenAll keeps the order of the tasks.
        return await Task.WhenAll(cooking);
    }

    /// The name of the first courier to accept the job.
    public static async Task<string> FirstCourierAsync(IReadOnlyList<Task<string>> couriers)
    {
        // The first await gives the task that finished first, the second its
        // name, or rethrows its exception.
        Task<string> first = await Task.WhenAny(couriers);
        return await first;
    }

    /// Logs that the table is waiting, then waits for its plates.
    public static async Task<string> ServeAsync(string table, Task<string[]> plates, List<string> log)
    {
        // This line runs at the call, like any method, before control goes back.
        log.Add($"{table}: waiting");
        string[] ready = await plates;
        log.Add($"{table}: {ready.Length} plates");
        return $"{table} served";
    }
}
