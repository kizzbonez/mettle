// Meter Readings
//
// A custom exception that keeps the line number and the original cause, an
// exception filter that watches without catching, and an async sum that is
// strict about its argument and hides no failure.

/// A line of readings that could not be read.
public sealed class ReadingException : Exception
{
    public ReadingException() { }
    public ReadingException(string message) : base(message) { }
    public ReadingException(string message, Exception inner) : base(message, inner) { }

    /// The number of the bad line, counting from 1.
    public int Line { get; init; }
}

public static class Meters
{
    /// The sum of the readings in lines such as "M-104:2231".
    public static int Total(IReadOnlyList<string> lines)
    {
        int total = 0;
        for (int i = 0; i < lines.Count; i++)
        {
            string line = lines[i];
            try
            {
                total += int.Parse(line[(line.IndexOf(':') + 1)..]);
            }
            catch (FormatException e)
            {
                // Wrap: a new type for our callers, the original kept as the cause.
                throw new ReadingException($"bad reading on line {i + 1}: \"{line}\"", e) { Line = i + 1 };
            }
        }
        return total;
    }

    /// Runs action, and logs any exception that passes without catching it.
    public static void Watched(Action action, List<string> log)
    {
        try
        {
            action();
        }
        catch (Exception e) when (Log(e, log))
        {
            // Never reached: the filter always answers "not mine".
        }
    }

    // A filter runs before the stack is unwound, so before any finally inside action.
    private static bool Log(Exception e, List<string> log)
    {
        log.Add($"failed: {e.Message}");
        return false;
    }

    /// The sum of the readings once all of them have arrived.
    public static Task<int> SumAsync(IReadOnlyList<Task<int>> readings)
    {
        // A usage error is thrown at the call, outside the async part.
        ArgumentNullException.ThrowIfNull(readings);
        return SumCoreAsync(readings);

        static async Task<int> SumCoreAsync(IReadOnlyList<Task<int>> readings)
        {
            Task<int[]> all = Task.WhenAll(readings);
            try
            {
                int[] values = await all;
                return values.Sum();
            }
            catch (Exception) when (all.Exception is not null)
            {
                // await rethrew only the first failure; the task holds every one.
                throw new AggregateException("some readings failed", all.Exception.InnerExceptions);
            }
        }
    }
}
