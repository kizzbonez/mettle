// Mountain Station
//
// Two lazy iterators and an async stream for a weather station: an endless
// schedule that checks its argument at once, readings up to the first gap, and
// a radio feed that a cancellation token can switch off.

using System.Runtime.CompilerServices;

public static class Station
{
    /// The minutes at which readings are taken: firstMinute, then every everyMinutes, for ever.
    public static IEnumerable<int> SampleTimes(int firstMinute, int everyMinutes)
    {
        // An ordinary method, so the check runs at the call...
        ArgumentOutOfRangeException.ThrowIfLessThan(everyMinutes, 1);
        return Times();

        // ...and a local iterator, which runs only when it is enumerated.
        IEnumerable<int> Times()
        {
            for (int minute = firstMinute; ; minute += everyMinutes)
                yield return minute;
        }
    }

    /// The readings up to the first missed one (null).
    public static IEnumerable<int> UntilGap(IEnumerable<int?> readings)
    {
        foreach (int? reading in readings)
        {
            if (reading is not int value) yield break;
            yield return value;
        }
    }

    /// The radio messages until "OVER".
    public static async IAsyncEnumerable<string> ListenAsync(
        Func<CancellationToken, Task<string>> receive,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        while (true)
        {
            string message = await receive(cancellationToken);
            if (message == "OVER") yield break;
            yield return message;
        }
    }
}
