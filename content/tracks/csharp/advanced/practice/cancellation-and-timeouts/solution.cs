// Harbour Crane
//
// Unload a ship one container at a time and stop cleanly when the harbour
// master presses Stop. Then ask the port office for a berth, giving up when a
// deadline passes, and tell a timeout apart from the caller's own cancellation.

public static class Harbour
{
    /// Lifts the containers in order and returns how many were lifted.
    public static async Task<int> UnloadAsync(
        IReadOnlyList<string> containers,
        Func<string, CancellationToken, Task> lift,
        CancellationToken cancellationToken = default)
    {
        int lifted = 0;
        foreach (string container in containers)
        {
            // A safe point: between two containers, never with one in the air.
            cancellationToken.ThrowIfCancellationRequested();
            await lift(container, cancellationToken);
            lifted++;
        }
        return lifted;
    }

    /// Asks for an answer, and throws TimeoutException if none comes within the limit.
    public static async Task<string> AskWithDeadlineAsync(
        Func<CancellationToken, Task<string>> ask,
        TimeSpan limit,
        CancellationToken cancellationToken = default)
    {
        // Canceled by the caller's token or by the clock, whichever comes first.
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(limit);
        try
        {
            return await ask(deadline.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException($"no answer within {limit.TotalMilliseconds} ms");
        }
    }
}
