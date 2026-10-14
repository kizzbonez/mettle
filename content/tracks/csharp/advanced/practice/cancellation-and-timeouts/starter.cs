// Harbour Crane
//
// Unload a ship one container at a time and stop cleanly when the harbour
// master presses Stop. Then ask the port office for a berth, giving up when a
// deadline passes, and tell a timeout apart from the caller's own cancellation.
// Add the `async` keyword to each method when you write its body.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public static class Harbour
{
    /// Lifts the containers in order and returns how many were lifted.
    public static Task<int> UnloadAsync(
        IReadOnlyList<string> containers,
        Func<string, CancellationToken, Task> lift,
        CancellationToken cancellationToken = default)
    {
        // TODO 1: check the token before each container, then await its lift
        throw new NotImplementedException();
    }

    /// Asks for an answer, and throws TimeoutException if none comes within the limit.
    public static Task<string> AskWithDeadlineAsync(
        Func<CancellationToken, Task<string>> ask,
        TimeSpan limit,
        CancellationToken cancellationToken = default)
    {
        // TODO 2: a linked source with CancelAfter, and a filter that turns the
        //         deadline's cancellation into a TimeoutException
        throw new NotImplementedException();
    }
}
