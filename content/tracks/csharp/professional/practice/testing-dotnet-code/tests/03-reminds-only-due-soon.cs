// RemindsOnlyDueSoon against correct jobs and against faulty jobs it has not seen.

// A reminder job written again from the instructions; each argument breaks one rule.
static ReminderJob Job(int from = 0, int to = 3, string format = "Refill for {0} due {1:yyyy-MM-dd}",
    bool reverse = false, bool twice = false, int extra = 0, bool realClock = false, bool patientAsPhone = false) =>
    async deps =>
    {
        DateOnly today = realClock ? DateOnly.FromDateTime(DateTime.UtcNow) : deps.Clock.Today;
        IEnumerable<Refill> refills = await deps.Store.DueRefillsAsync();
        if (reverse) refills = refills.Reverse().ToList();
        int sent = 0;
        foreach (Refill refill in refills)
        {
            if (refill.Due < today.AddDays(from) || refill.Due > today.AddDays(to)) continue;
            string text = string.Format(System.Globalization.CultureInfo.InvariantCulture, format, refill.Patient, refill.Due);
            for (int copy = 0; copy < (twice ? 2 : 1); copy++)
            {
                for (int attempt = 1; attempt <= 3; attempt++)
                {
                    try
                    {
                        await deps.Sms.SendAsync(patientAsPhone ? refill.Patient : refill.Phone, text);
                        sent++;
                        break;
                    }
                    catch (TimeoutException) when (attempt < 3)
                    {
                        await deps.Delay(TimeSpan.FromSeconds(attempt));
                    }
                    catch (TimeoutException)
                    {
                    }
                }
            }
        }
        return sent + extra;
    };

// Correct jobs pass, and so do jobs whose only fault is in how they handle timeouts.
Check.True(await Checks.RemindsOnlyDueSoon(Job()), "RemindsOnlyDueSoon passes a second correct job, written differently");
Check.True(await Checks.RemindsOnlyDueSoon(Jobs.Correct), "RemindsOnlyDueSoon passes the correct job");
Check.True(await Checks.RemindsOnlyDueSoon(Jobs.PullRequestB), "RemindsOnlyDueSoon passes pull request B, whose fault needs a timeout");
Check.True(await Checks.RemindsOnlyDueSoon(Jobs.PullRequestC), "RemindsOnlyDueSoon passes pull request C, whose fault needs a timeout");

// Faulty jobs fail.
(ReminderJob Job, string Fault)[] faulty =
[
    (Jobs.PullRequestA, "pull request A, which misses the third day"),
    (Job(from: -1), "a job that also reminds refills due yesterday"),
    (Job(from: 1), "a job that skips refills due today"),
    (Job(to: 4), "a job that also reminds refills due in four days"),
    (Job(to: 2), "a job that skips refills due in three days"),
    (Job(from: -30, to: 30), "a job that reminds every refill"),
    (Job(format: "Refill for {0} due {1:dd/MM/yyyy}"), "a job that writes the date in another format"),
    (Job(format: "Refill due {1:yyyy-MM-dd}"), "a job that leaves the patient out of the text"),
    (Job(format: "Refill for {0} due {1:yyyy-MM-dd}."), "a job that adds a full stop to the text"),
    (Job(patientAsPhone: true), "a job that sends to the wrong number"),
    (Job(reverse: true), "a job that sends in reverse order"),
    (Job(twice: true), "a job that sends every reminder twice"),
    (Job(extra: 1), "a job that returns one more than it sent"),
    (Job(extra: -1), "a job that returns one less than it sent"),
    (Job(realClock: true), "a job that reads the real date instead of its clock"),
];
foreach (var (job, fault) in faulty)
    Check.True(!await Checks.RemindsOnlyDueSoon(job), $"RemindsOnlyDueSoon fails {fault}");

// The check gives the same answer every time.
Check.True(await Checks.RemindsOnlyDueSoon(Jobs.Correct) && !await Checks.RemindsOnlyDueSoon(Job(to: 2)),
    "RemindsOnlyDueSoon gives the same answers when it runs again");
