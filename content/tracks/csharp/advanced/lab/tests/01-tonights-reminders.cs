// Tonight's list for the Harbour Street clinic. The gateway accepts every message at once.
var appointments = new List<Appointment>
{
    new("Ada Lovelace", "+44 7700 900101", new DateTime(2026, 10, 15, 9, 30, 0)),
    new("Grace Hopper", "+44 7700 900102", new DateTime(2026, 10, 15, 10, 0, 0)),
    new("Alan Turing", "+44 7700 900103", new DateTime(2026, 10, 15, 14, 15, 0)),
    new("Mary Jackson", "+44 7700 900104", new DateTime(2026, 10, 16, 8, 5, 0)),
};

Check.Equal(
    ReminderDispatcher.FormatMessage(appointments[0]),
    "Hello Ada Lovelace, this is Larkspur Clinic. Your appointment is on 2026-10-15 at 09:30.",
    "FormatMessage builds the reminder text described in the instructions");

var sent = new List<(string Phone, string Text)>();
Task Gateway(string phone, string text, CancellationToken token)
{
    lock (sent) sent.Add((phone, text));
    return Task.CompletedTask;
}

var dispatcher = new ReminderDispatcher(Gateway, batchSize: 2, maxAttempts: 3);
var notified = new List<string>();
dispatcher.ReminderSent += (sender, e) =>
{
    lock (notified) notified.Add($"{e.Patient}/{e.Attempts}");
};

IReadOnlyList<ReminderResult> results = await dispatcher.SendAllAsync(appointments);

Check.SequenceEqual(
    results,
    appointments.Select(a => new ReminderResult(a.Patient, Outcome.Sent, 1)),
    "one Sent result per appointment, in the order of the list, each after one attempt");
Check.Equal(sent.Count, 4, "the gateway receives exactly one message per appointment");
Check.True(
    sent.Contains(("+44 7700 900104", ReminderDispatcher.FormatMessage(appointments[3]))),
    "each message goes to the patient's own phone with the formatted text");
Check.SequenceEqual(
    notified.Order(),
    new[] { "Ada Lovelace/1", "Alan Turing/1", "Grace Hopper/1", "Mary Jackson/1" },
    "ReminderSent is raised once per delivered reminder, with the patient and the attempt count");

// The overnight run has nobody listening for ReminderSent.
var quiet = new ReminderDispatcher(Gateway, batchSize: 3, maxAttempts: 1);
try
{
    IReadOnlyList<ReminderResult> again = await quiet.SendAllAsync(appointments.Take(1));
    Check.Equal(again.Count, 1, "a dispatcher without subscribers still sends and reports");
}
catch (NullReferenceException)
{
    Check.True(false, "raising ReminderSent when nobody has subscribed must not throw");
}
