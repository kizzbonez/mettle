// Bench Kit
//
// A small measuring kit for a team that wants numbers it can trust in CI:
// timings taken after a warm-up and reported as a median, and allocation
// budgets that a test can assert on, because a byte count does not depend on
// how busy the build machine is.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public static class Measure
{
    /// <summary>
    /// The middle value of the sorted samples, or the mean of the two middle
    /// values when there is an even number of them. The input is not changed.
    /// </summary>
    public static double Median(IReadOnlyList<long> samples)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Runs <paramref name="work"/> <paramref name="warmups"/> times without
    /// timing it, then <paramref name="samples"/> times, each timed with
    /// <paramref name="clock"/>. Returns the elapsed clock ticks of each sample.
    /// </summary>
    public static long[] Time(Action work, int warmups, int samples, Func<long> clock)
    {
        throw new NotImplementedException();
    }

    /// <summary>The bytes one call of <paramref name="work"/> allocates on this thread, after one call to warm it up.</summary>
    public static long AllocatedBy(Action work)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// An allocation regression test: returns what <paramref name="work"/>
    /// allocates, or throws if that is more than <paramref name="budget"/>.
    /// </summary>
    public static long WithinBudget(string name, Action work, long budget)
    {
        throw new NotImplementedException();
    }
}
