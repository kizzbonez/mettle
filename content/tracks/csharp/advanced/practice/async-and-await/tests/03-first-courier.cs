async Task<T> Finish<T>(Task<T> task, string what)
{
    try { return await task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// Three couriers, and the one in the middle answers first.
var ali = new TaskCompletionSource<string>();
var bea = new TaskCompletionSource<string>();
var cem = new TaskCompletionSource<string>();
Task<string> courier = Kitchen.FirstCourierAsync([ali.Task, bea.Task, cem.Task]);
Check.True(!courier.IsCompleted, "FirstCourierAsync waits while no courier has answered");
bea.SetResult("Bea");
string first = await Finish(courier, "FirstCourierAsync finishes as soon as one courier answers");
Check.Equal(first, "Bea", "the name from the first courier who answered");
Check.True(!ali.Task.IsCompleted && !cem.Task.IsCompleted, "the other couriers had not answered yet");

// The last one in the list answers first, and the others answer later.
var dan = new TaskCompletionSource<string>();
var eva = new TaskCompletionSource<string>();
Task<string> second = Kitchen.FirstCourierAsync([dan.Task, eva.Task]);
eva.SetResult("Eva");
dan.SetResult("Dan");
Check.Equal(await Finish(second, "FirstCourierAsync finishes when a courier answers"), "Eva", "the courier who answered first, not the first in the list");

// One courier has already answered when the method is called.
var fay = new TaskCompletionSource<string>();
Task<string> waiting = Kitchen.FirstCourierAsync([fay.Task, Task.FromResult("Gus")]);
Check.Equal(await Finish(waiting, "FirstCourierAsync finishes when a courier has already answered"), "Gus", "a courier who had answered before the call");

// The first courier to answer has a breakdown.
var hal = new TaskCompletionSource<string>();
var ivy = new TaskCompletionSource<string>();
Task<string> broken = Kitchen.FirstCourierAsync([hal.Task, ivy.Task]);
ivy.SetException(new InvalidOperationException("scooter broke down"));
Task finished = await Task.WhenAny(broken, Task.Delay(3000));
Check.True(finished == broken, "FirstCourierAsync finishes when the first courier to answer fails");
await Check.ThrowsAsync<InvalidOperationException>(
    () => broken,
    "the exception of the first courier to answer comes out of FirstCourierAsync unchanged");

// A courier who fails after another has accepted changes nothing.
var jo = new TaskCompletionSource<string>();
var kim = new TaskCompletionSource<string>();
Task<string> later = Kitchen.FirstCourierAsync([jo.Task, kim.Task]);
jo.SetResult("Jo");
kim.SetException(new InvalidOperationException("lost the keys"));
Check.Equal(await Finish(later, "FirstCourierAsync finishes when a courier answers"), "Jo", "a failure after the first answer does not matter");
