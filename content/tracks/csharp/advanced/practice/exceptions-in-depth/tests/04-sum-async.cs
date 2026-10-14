async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// A null list is a usage error, reported at the call.
Task<int>? returned = null;
try
{
    returned = Meters.SumAsync(null!);
}
catch (ArgumentNullException) { }
Check.True(returned is null, "SumAsync(null) throws at the call instead of returning a failed task");

// Readings that arrive later, back to front.
var first = new TaskCompletionSource<int>();
var second = new TaskCompletionSource<int>();
var third = new TaskCompletionSource<int>();
Task<int> sum = Meters.SumAsync([first.Task, second.Task, third.Task]);
Check.True(!sum.IsCompleted, "SumAsync waits while readings are missing");
third.SetResult(300);
second.SetResult(20);
Check.True(!sum.IsCompleted, "SumAsync waits until the last reading has arrived");
first.SetResult(1);
Check.Equal(await Finish(sum, "SumAsync finishes once every reading has arrived"), 321, "the sum of three readings");
Check.Equal(await Finish(Meters.SumAsync([]), "SumAsync finishes for no readings"), 0, "the sum of no readings");

// Failures that happen back to front are reported in the order of the list.
var a = new TaskCompletionSource<int>();
var b = new TaskCompletionSource<int>();
var c = new TaskCompletionSource<int>();
var d = new TaskCompletionSource<int>();
Task<int> failing = Meters.SumAsync([a.Task, b.Task, c.Task, d.Task]);
d.SetException(new IOException("van D offline"));
c.SetResult(10);
b.SetException(new InvalidOperationException("van B sent garbage"));
a.SetException(new IOException("van A offline"));
try
{
    await Finish(failing, "SumAsync finishes once every reading has arrived or failed");
    Check.True(false, "SumAsync fails when readings failed");
}
catch (AggregateException e)
{
    Check.SequenceEqual(
        e.InnerExceptions.Select(inner => inner.Message),
        ["van A offline", "van B sent garbage", "van D offline"],
        "every failure is in the AggregateException, in the order of the list");
    Check.True(e.InnerExceptions[1] is InvalidOperationException, "the failures keep their own types");
}
catch (Exception e) when (e is not CheckFailed)
{
    Check.True(false, "the failures come out of SumAsync together, as one AggregateException");
}

// One failure among good readings.
try
{
    await Meters.SumAsync([Task.FromResult(1), Task.FromException<int>(new IOException("van E offline"))]);
    Check.True(false, "SumAsync fails when a reading failed");
}
catch (AggregateException e)
{
    Check.Equal(e.InnerExceptions.Count, 1, "the number of failures inside the AggregateException");
    Check.True(e.InnerExceptions[0] is IOException, "the one failure inside the AggregateException");
}
catch (Exception e) when (e is not CheckFailed)
{
    Check.True(false, "a single failure also comes out of SumAsync as an AggregateException");
}
