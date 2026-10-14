// Kitchen Pass
//
// Three async methods for the pass of a restaurant kitchen: start every dish
// at once and wait for all of them, take the first courier who answers, and
// see where an async method stops and hands control back to its caller.
// Add the `async` keyword to each method when you write its body.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public static class Kitchen
{
    /// Cooks every dish at the same time and returns the plates in the order of the ticket.
    public static Task<string[]> CookTableAsync(IReadOnlyList<string> dishes, Func<string, Task<string>> cook)
    {
        // TODO 1: start every dish first, then await them all together
        throw new NotImplementedException();
    }

    /// The name of the first courier to accept the job.
    public static Task<string> FirstCourierAsync(IReadOnlyList<Task<string>> couriers)
    {
        // TODO 2: complete as soon as the first courier answers
        throw new NotImplementedException();
    }

    /// Logs that the table is waiting, then waits for its plates.
    public static Task<string> ServeAsync(string table, Task<string[]> plates, List<string> log)
    {
        // TODO 3: log "waiting" before the first await, and the plate count after it
        throw new NotImplementedException();
    }
}
