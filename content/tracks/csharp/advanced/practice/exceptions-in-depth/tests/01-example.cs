// 1. Totals, and a bad line.
Check.Equal(Meters.Total(["M-101:120", "M-102:80"]), 200, "the total of two good readings");
try
{
    Meters.Total(["M-101:120", "M-102:eighty"]);
    Check.True(false, "Total throws ReadingException for a reading that is not a number");
}
catch (ReadingException e)
{
    Check.Equal(e.Line, 2, "the Line of the ReadingException for the second line");
    Check.True(e.InnerException is FormatException, "the inner exception of the ReadingException is the FormatException");
}

// 2. Watching without catching.
var log = new List<string>();
try
{
    Meters.Watched(() =>
    {
        try { throw new InvalidOperationException("valve stuck"); }
        finally { log.Add("valve closed"); }
    }, log);
    Check.True(false, "the exception goes on to the caller of Watched");
}
catch (InvalidOperationException) { }
Check.SequenceEqual(log, ["failed: valve stuck", "valve closed"], "the log, with the filter's line before the finally block's");

// 3. Summing readings that arrive as tasks.
Check.Equal(await Meters.SumAsync([Task.FromResult(5), Task.FromResult(7)]), 12, "the sum of two readings");
Check.Throws<ArgumentNullException>(() => Meters.SumAsync(null!), "SumAsync(null), at the call");

Task<int> north = Task.FromException<int>(new IOException("north van offline"));
Task<int> south = Task.FromException<int>(new IOException("south van offline"));
try
{
    await Meters.SumAsync([north, Task.FromResult(3), south]);
    Check.True(false, "SumAsync fails when readings failed");
}
catch (AggregateException e)
{
    Check.SequenceEqual(
        e.InnerExceptions.Select(inner => inner.Message),
        ["north van offline", "south van offline"],
        "the failures inside the AggregateException");
}
catch (Exception e) when (e is not CheckFailed and not NotImplementedException)
{
    Check.True(false, "the failures come out of SumAsync together, as one AggregateException");
}
