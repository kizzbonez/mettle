// The spy on its own.
var quiet = new SpySms();
await quiet.SendAsync("+1", "a");
await quiet.SendAsync("+2", "b");
await quiet.SendAsync("+1", "c");
Check.Equal(quiet.Calls, 3, "calls counted by a spy that never fails");
Check.SequenceEqual(quiet.Sent, [("+1", "a"), ("+2", "b"), ("+1", "c")], "messages a spy that never fails recorded, in order");

var fresh = new SpySms(failFirst: 2);
Check.Equal(fresh.Calls, 0, "calls counted by a new spy");
Check.SequenceEqual(fresh.Sent, [], "messages recorded by a new spy");

var down = new SpySms(failFirst: 3);
for (int call = 1; call <= 3; call++)
    await Check.ThrowsAsync<TimeoutException>(() => down.SendAsync("+3", "retry me"), $"call {call} to a spy that fails its first three calls");
Check.Equal(down.Calls, 3, "calls counted after three timeouts");
Check.SequenceEqual(down.Sent, [], "a call that timed out is not recorded as sent");
await down.SendAsync("+3", "retry me");
await down.SendAsync("+4", "next");
Check.Equal(down.Calls, 5, "calls counted after three timeouts and two successes");
Check.SequenceEqual(down.Sent, [("+3", "retry me"), ("+4", "next")], "messages recorded once the timeouts are over");

// The spy in a run of the correct job.
var today = new DateOnly(2026, 11, 3);
var flaky = new SpySms(failFirst: 2);
var waits = new List<TimeSpan>();
int sent = await Jobs.Correct(new Deps(new StubClock(today), new FakeStore(new Refill("Mo", "+5", today)), flaky,
    wait => { waits.Add(wait); return Task.CompletedTask; }));
Check.Equal(sent, 1, "reminders the correct job sent through a spy that fails twice");
Check.Equal(flaky.Calls, 3, "calls the correct job made to a spy that fails twice");
Check.SequenceEqual(flaky.Sent, [("+5", "Refill for Mo due 2026-11-03")], "the message the spy recorded from the correct job");
Check.SequenceEqual(waits, [TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(2)], "the waits of the correct job");
