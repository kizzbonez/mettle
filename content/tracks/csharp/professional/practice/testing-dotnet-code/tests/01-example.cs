// The example from the instructions.
var sms = new SpySms(failFirst: 1);
await Check.ThrowsAsync<TimeoutException>(() => sms.SendAsync("+4790000001", "hello"), "the first call to a spy that fails one call");
await sms.SendAsync("+4790000002", "again");
Check.Equal(sms.Calls, 2, "calls counted by the spy, the failed one included");
Check.SequenceEqual(sms.Sent, [("+4790000002", "again")], "messages the spy recorded as sent");

Check.True(await Checks.RemindsOnlyDueSoon(Jobs.Correct), "RemindsOnlyDueSoon passes the correct job");
Check.True(await Checks.RetriesTimeouts(Jobs.Correct), "RetriesTimeouts passes the correct job");
Check.True(!await Checks.RemindsOnlyDueSoon(Jobs.PullRequestA), "RemindsOnlyDueSoon fails pull request A");
Check.True(!await Checks.RetriesTimeouts(Jobs.PullRequestB), "RetriesTimeouts fails pull request B");
Check.True(await Checks.RemindsOnlyDueSoon(Jobs.PullRequestB), "RemindsOnlyDueSoon passes pull request B, which behaves when nothing times out");
