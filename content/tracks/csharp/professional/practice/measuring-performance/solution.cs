// Bench Kit
//
// A small measuring kit for a team that wants numbers it can trust in CI:
// timings taken after a warm-up and reported as a median, and allocation
// budgets that a test can assert on, because a byte count does not depend on
// how busy the build machine is.

public static class Measure
{
    /// <summary>
    /// The middle value of the sorted samples, or the mean of the two middle
    /// values when there is an even number of them. The input is not changed.
    /// </summary>
    public static double Median(IReadOnlyList<long> samples)
    {
        if (samples.Count == 0) throw new ArgumentException("there is no median of no samples", nameof(samples));
        long[] sorted = samples.Order().ToArray();   // a sorted copy
        int middle = sorted.Length / 2;
        return sorted.Length % 2 == 1
            ? sorted[middle]
            : (sorted[middle - 1] + (double)sorted[middle]) / 2;
    }

    /// <summary>
    /// Runs <paramref name="work"/> <paramref name="warmups"/> times without
    /// timing it, then <paramref name="samples"/> times, each timed with
    /// <paramref name="clock"/>. Returns the elapsed clock ticks of each sample.
    /// </summary>
    public static long[] Time(Action work, int warmups, int samples, Func<long> clock)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(warmups);
        ArgumentOutOfRangeException.ThrowIfLessThan(samples, 1);

        // JIT, tier 0 code and first-call setup land here, outside the samples.
        for (int i = 0; i < warmups; i++) work();

        var elapsed = new long[samples];
        for (int i = 0; i < samples; i++)
        {
            long start = clock();
            work();
            elapsed[i] = clock() - start;
        }
        return elapsed;
    }

    /// <summary>The bytes one call of <paramref name="work"/> allocates on this thread, after one call to warm it up.</summary>
    public static long AllocatedBy(Action work)
    {
        work();
        long before = GC.GetAllocatedBytesForCurrentThread();
        work();
        return GC.GetAllocatedBytesForCurrentThread() - before;
    }

    /// <summary>
    /// An allocation regression test: returns what <paramref name="work"/>
    /// allocates, or throws if that is more than <paramref name="budget"/>.
    /// </summary>
    public static long WithinBudget(string name, Action work, long budget)
    {
        long bytes = AllocatedBy(work);
        if (bytes > budget)
            throw new InvalidOperationException($"{name} allocated {bytes} B, budget {budget} B");
        return bytes;
    }
}
