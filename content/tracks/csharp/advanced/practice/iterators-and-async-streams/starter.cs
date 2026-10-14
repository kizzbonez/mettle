// Mountain Station
//
// Two lazy iterators and an async stream for a weather station: an endless
// schedule that checks its argument at once, readings up to the first gap, and
// a radio feed that a cancellation token can switch off.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

using System.Runtime.CompilerServices;

public static class Station
{
    /// The minutes at which readings are taken: firstMinute, then every everyMinutes, for ever.
    public static IEnumerable<int> SampleTimes(int firstMinute, int everyMinutes)
    {
        // TODO 1: check everyMinutes here, then return a local iterator function
        throw new NotImplementedException();
    }

    /// The readings up to the first missed one (null).
    public static IEnumerable<int> UntilGap(IEnumerable<int?> readings)
    {
        // TODO 2: yield return each reading, and yield break at the first null
        throw new NotImplementedException();
    }

    /// The radio messages until "OVER". Make this an async iterator:
    /// `public static async IAsyncEnumerable<string> ListenAsync(...)`.
    public static IAsyncEnumerable<string> ListenAsync(
        Func<CancellationToken, Task<string>> receive,
        CancellationToken cancellationToken = default)
    {
        // TODO 3: await each message and yield it; mark the token [EnumeratorCancellation]
        throw new NotImplementedException();
    }
}
