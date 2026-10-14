// Meter Readings
//
// A custom exception that keeps the line number and the original cause, an
// exception filter that watches without catching, and an async sum that is
// strict about its argument and hides no failure.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// A line of readings that could not be read.
public sealed class ReadingException : Exception
{
    // TODO 1: the three standard constructors

    /// The number of the bad line, counting from 1.
    public int Line { get; init; }
}

public static class Meters
{
    /// The sum of the readings in lines such as "M-104:2231".
    public static int Total(IReadOnlyList<string> lines)
    {
        // TODO 2: wrap a FormatException in a ReadingException
        throw new NotImplementedException();
    }

    /// Runs action, and logs any exception that passes without catching it.
    public static void Watched(Action action, List<string> log)
    {
        // TODO 3: an exception filter that logs and returns false
        throw new NotImplementedException();
    }

    /// The sum of the readings once all of them have arrived.
    public static Task<int> SumAsync(IReadOnlyList<Task<int>> readings)
    {
        // TODO 4: check the argument here, then await in a local async function
        throw new NotImplementedException();
    }
}
