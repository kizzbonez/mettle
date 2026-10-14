// RetriesTimeouts against correct jobs and against faulty jobs it has not seen.

// A reminder job written again from the instructions; each argument breaks one rule.
static ReminderJob Job(int attempts = 3, Func<int, TimeSpan>? wait = null, bool noWait = false, bool waitFirst = false,
    bool countGivenUp = false, bool stopAfterGivingUp = false) =>
    async deps =>
    {
        DateOnly today = deps.Clock.Today;
        int sent = 0;
        foreach (Refill refill in await deps.Store.DueRefillsAsync())
        {
            if (refill.Due < today || refill.Due > today.AddDays(3)) continue;
            string text = $"Refill for {refill.Patient} due {refill.Due:yyyy-MM-dd}";
            bool delivered = false;
            if (waitFirst) await deps.Delay(TimeSpan.Zero);
            for (int attempt = 1; attempt <= attempts && !delivered; attempt++)
            {
                try
                {
                    await deps.Sms.SendAsync(refill.Phone, text);
                    delivered = true;
                }
                catch (TimeoutException) when (attempt < attempts)
                {
                    if (!noWait) await deps.Delay((wait ?? (n => TimeSpan.FromSeconds(n)))(attempt));
                }
                catch (TimeoutException)
                {
                }
            }
            if (delivered || countGivenUp) sent++;
            if (!delivered && stopAfterGivingUp) break;
        }
        return sent;
    };

// Correct jobs pass.
Check.True(await Checks.RetriesTimeouts(Job()), "RetriesTimeouts passes a second correct job, written differently");
Check.True(await Checks.RetriesTimeouts(Jobs.Correct), "RetriesTimeouts passes the correct job");

// Faulty jobs fail.
(ReminderJob Job, string Fault)[] faulty =
[
    (Jobs.PullRequestB, "pull request B, which waits 2 s and 4 s"),
    (Jobs.PullRequestC, "pull request C, which counts a reminder it gave up on"),
    (Job(attempts: 2), "a job that gives up after two attempts"),
    (Job(attempts: 4), "a job that makes a fourth attempt"),
    (Job(attempts: 1), "a job that never retries"),
    (Job(noWait: true), "a job that retries without waiting"),
    (Job(wait: n => TimeSpan.FromSeconds(1)), "a job that waits 1 s before every retry"),
    (Job(wait: n => TimeSpan.FromMilliseconds(n)), "a job that waits milliseconds instead of seconds"),
    (Job(wait: n => TimeSpan.FromSeconds(3 - n)), "a job that waits 2 s and then 1 s"),
    (Job(waitFirst: true), "a job that also waits before its first attempt"),
    (Job(countGivenUp: true), "a job that counts a reminder it gave up on"),
    (Job(stopAfterGivingUp: true), "a job that stops after the first refill it gives up on"),
];
foreach (var (job, fault) in faulty)
    Check.True(!await Checks.RetriesTimeouts(job), $"RetriesTimeouts fails {fault}");

Check.True(await Checks.RetriesTimeouts(Jobs.Correct) && !await Checks.RetriesTimeouts(Job(attempts: 4)),
    "RetriesTimeouts gives the same answers when it runs again");
