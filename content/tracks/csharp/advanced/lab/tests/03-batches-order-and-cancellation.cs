var start = new DateTime(2026, 10, 16, 9, 0, 0);
List<Appointment> Bookings(int count) =>
    Enumerable.Range(1, count)
        .Select(i => new Appointment($"Patient {i}", $"+1 555 02{i:00}", start.AddMinutes(15 * i)))
        .ToList();

// A gateway that delivers a message only when this test says so, and that honours its token.
var pending = new List<TaskCompletionSource>();
var waiters = new List<(int Count, TaskCompletionSource Reached)>();
int inFlight = 0;
int maxInFlight = 0;

Task Gateway(string phone, string text, CancellationToken token)
{
    var delivered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    lock (pending)
    {
        pending.Add(delivered);
        inFlight++;
        maxInFlight = Math.Max(maxInFlight, inFlight);
        foreach (var waiter in waiters)
            if (pending.Count >= waiter.Count) waiter.Reached.TrySetResult();
    }
    return Track(delivered.Task.WaitAsync(token));
}

async Task Track(Task delivery)
{
    try { await delivery; }
    finally { lock (pending) inFlight--; }
}

int Started()
{
    lock (pending) return pending.Count;
}

TaskCompletionSource Call(int index)
{
    lock (pending) return pending[index];
}

// Waits until the gateway has been called `count` times in total.
async Task CallsReached(int count, string what)
{
    var reached = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    lock (pending)
    {
        if (pending.Count >= count) reached.TrySetResult();
        else waiters.Add((count, reached));
    }
    try { await reached.Task.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); }
}

async Task<IReadOnlyList<ReminderResult>> Finish(Task<IReadOnlyList<ReminderResult>> run, string what)
{
    try { return await run.WaitAsync(TimeSpan.FromSeconds(3)); }
    catch (TimeoutException) { Check.True(false, what); throw; }
}

// 1. Batches of three, delivered out of order.
var dispatcher = new ReminderDispatcher(Gateway, batchSize: 3, maxAttempts: 2);
List<Appointment> five = Bookings(5);
Task<IReadOnlyList<ReminderResult>> run = dispatcher.SendAllAsync(five);

await CallsReached(3, "the first batch of reminders is handed to the gateway");
Check.Equal(Started(), 3,
    "while a batch is in flight, no more than batchSize messages have been handed to the gateway");
Call(2).SetResult();
Call(0).SetResult();
Call(1).SetResult();

await CallsReached(5, "the next batch is sent once every message of the previous batch has finished");
Call(4).SetResult();
Call(3).SetResult();

IReadOnlyList<ReminderResult> results = await Finish(run, "SendAllAsync finishes once every message is delivered");
Check.SequenceEqual(
    results,
    five.Select(a => new ReminderResult(a.Patient, Outcome.Sent, 1)),
    "results follow the order of the list, whatever order the gateway delivers in");
Check.True(maxInFlight <= 3, "never more than batchSize messages are in flight at the same time");

// 2. The operator presses Stop while the second message is still in flight.
lock (pending)
{
    pending.Clear();
    waiters.Clear();
}
using var stop = new CancellationTokenSource();
var deliveredTo = new List<string>();
var firstDelivered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
var cancellable = new ReminderDispatcher(Gateway, batchSize: 2, maxAttempts: 3);
cancellable.ReminderSent += (sender, e) =>
{
    lock (deliveredTo) deliveredTo.Add(e.Patient);
    firstDelivered.TrySetResult();
};

Task<IReadOnlyList<ReminderResult>> evening = cancellable.SendAllAsync(Bookings(5), stop.Token);
await CallsReached(2, "the first batch of reminders is handed to the gateway");
Call(0).SetResult();
try { await firstDelivered.Task.WaitAsync(TimeSpan.FromSeconds(3)); }
catch (TimeoutException) { Check.True(false, "ReminderSent is raised as soon as a message is delivered"); }

stop.Cancel();

IReadOnlyList<ReminderResult> stopped = [];
try
{
    stopped = await Finish(evening,
        "after cancellation SendAllAsync finishes promptly: the token must reach the gateway");
}
catch (OperationCanceledException)
{
    Check.True(false, "SendAllAsync reports cancelled reminders in its results instead of throwing");
}

Check.SequenceEqual(
    stopped,
    new[]
    {
        new ReminderResult("Patient 1", Outcome.Sent, 1),
        new ReminderResult("Patient 2", Outcome.Cancelled, 1),
        new ReminderResult("Patient 3", Outcome.Cancelled, 0),
        new ReminderResult("Patient 4", Outcome.Cancelled, 0),
        new ReminderResult("Patient 5", Outcome.Cancelled, 0),
    },
    "after Stop, the message in flight and every reminder not yet sent are reported as Cancelled");
Check.Equal(Started(), 2, "no new message is handed to the gateway after cancellation");
Check.SequenceEqual(deliveredTo, new[] { "Patient 1" }, "ReminderSent is raised only for the delivered message");
