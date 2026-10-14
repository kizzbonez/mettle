var start = new DateTime(2026, 10, 15, 11, 0, 0);
Appointment Booking(string patient, string phone) => new(patient, phone, start);

// What the gateway answers on each call for a number, in order. Calls past the script succeed.
var script = new Dictionary<string, Queue<string>>
{
    ["+1 555 0101"] = new(["busy", "busy"]),
    ["+1 555 0102"] = new(["busy", "busy", "busy", "busy", "busy"]),
    ["+1 555 0103"] = new(["invalid", "invalid"]),
    ["+1 555 0104"] = new(),
    ["+1 555 0199"] = new(["broken"]),
};
var calls = new Dictionary<string, int>();

Task Gateway(string phone, string text, CancellationToken token)
{
    string step;
    lock (calls)
    {
        calls[phone] = calls.GetValueOrDefault(phone) + 1;
        step = script[phone].Count > 0 ? script[phone].Dequeue() : "ok";
    }
    return step switch
    {
        "busy" => Task.FromException(new GatewayBusyException()),
        "invalid" => Task.FromException(new InvalidNumberException($"{phone} is not in service")),
        "broken" => Task.FromException(new InvalidOperationException("gateway credentials rejected")),
        _ => Task.CompletedTask,
    };
}

// Arguments are checked when the call is made.
Check.Throws<ArgumentNullException>(
    () => new ReminderDispatcher(null!, 2, 3), "the constructor rejects a missing gateway");
Check.Throws<ArgumentOutOfRangeException>(
    () => new ReminderDispatcher(Gateway, 0, 3), "the constructor rejects a batch size below 1");
Check.Throws<ArgumentOutOfRangeException>(
    () => new ReminderDispatcher(Gateway, 2, 0), "the constructor rejects maxAttempts below 1");

var dispatcher = new ReminderDispatcher(Gateway, batchSize: 2, maxAttempts: 3);
Check.Throws<ArgumentNullException>(
    () => { _ = dispatcher.SendAllAsync(null!); },
    "SendAllAsync rejects a missing list at the call itself, not later inside the returned task");
IReadOnlyList<ReminderResult> none = await dispatcher.SendAllAsync([]);
Check.Equal(none.Count, 0, "an empty list gives an empty result");

var notified = new List<string>();
dispatcher.ReminderSent += (sender, e) =>
{
    lock (notified) notified.Add($"{e.Patient}/{e.Attempts}");
};

IReadOnlyList<ReminderResult> results = await dispatcher.SendAllAsync(
[
    Booking("Ada", "+1 555 0101"),
    Booking("Grace", "+1 555 0102"),
    Booking("Linus", "+1 555 0103"),
    Booking("Barbara", "+1 555 0104"),
]);

Check.Equal(results.Count, 4, "one result per appointment");
Check.Equal(results[0], new ReminderResult("Ada", Outcome.Sent, 3),
    "a busy gateway is tried again until the message goes through, and the attempts are counted");
Check.Equal(results[1], new ReminderResult("Grace", Outcome.GaveUp, 3),
    "a reminder that is still busy after maxAttempts attempts is given up");
Check.Equal(calls["+1 555 0102"], 3, "a number is never tried more than maxAttempts times");
Check.Equal(results[2], new ReminderResult("Linus", Outcome.InvalidNumber, 1),
    "an invalid number is reported as such");
Check.Equal(calls["+1 555 0103"], 1, "an invalid number is not tried again");
Check.Equal(results[3], new ReminderResult("Barbara", Outcome.Sent, 1),
    "a failure elsewhere does not affect the other reminders");
Check.SequenceEqual(notified.Order(), new[] { "Ada/3", "Barbara/1" },
    "ReminderSent is raised only for delivered reminders, with their attempt counts");

script["+1 555 0101"] = new(["busy"]);
var once = new ReminderDispatcher(Gateway, batchSize: 5, maxAttempts: 1);
IReadOnlyList<ReminderResult> single = await once.SendAllAsync([Booking("Ada", "+1 555 0101")]);
Check.Equal(single[0], new ReminderResult("Ada", Outcome.GaveUp, 1),
    "with maxAttempts 1 a busy answer is not retried");

await Check.ThrowsAsync<InvalidOperationException>(
    () => dispatcher.SendAllAsync([Booking("Barbara", "+1 555 0104"), Booking("Edsger", "+1 555 0199")]),
    "an unexpected gateway error is neither swallowed nor wrapped: it comes out of the awaited SendAllAsync as it was");
