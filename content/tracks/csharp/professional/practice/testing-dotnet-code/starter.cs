// Refill Reminders
//
// A pharmacy's job that texts patients whose prescription refill is due soon.
// Every dependency is passed in, so a test can replace each one: a stub clock,
// a fake store, a spy for the text-message gateway, and a delay that records
// how long it was asked to wait instead of waiting. Two checks built from them
// expose the faulty pull requests.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public sealed record Refill(string Patient, string Phone, DateOnly Due);

public interface IClock { DateOnly Today { get; } }

public interface IRefillStore { Task<IReadOnlyList<Refill>> DueRefillsAsync(); }

public interface ISmsGateway { Task SendAsync(string phone, string text); }

/// <summary>Everything a reminder job needs. Production passes Task.Delay as the delay.</summary>
public sealed record Deps(IClock Clock, IRefillStore Store, ISmsGateway Sms, Func<TimeSpan, Task> Delay);

/// <summary>A reminder job: runs once with its dependencies and returns how many reminders it sent.</summary>
public delegate Task<int> ReminderJob(Deps deps);

/// <summary>A stub: always the same day.</summary>
public sealed class StubClock(DateOnly today) : IClock
{
    public DateOnly Today => today;
}

/// <summary>A fake: a store that works, from a list in memory.</summary>
public sealed class FakeStore(params Refill[] refills) : IRefillStore
{
    public Task<IReadOnlyList<Refill>> DueRefillsAsync() => Task.FromResult<IReadOnlyList<Refill>>(refills);
}

// ---- The job as specified, and three pull requests. Leave them as they are. ----

public static class Jobs
{
    /// <summary>The job as the instructions specify it.</summary>
    public static Task<int> Correct(Deps deps) => Run(deps, lastDay: 3, wait: attempt => TimeSpan.FromSeconds(attempt), countGivenUp: false);

    /// <summary>Pull request A: "Simplified the date window."</summary>
    public static Task<int> PullRequestA(Deps deps) => Run(deps, lastDay: 2, wait: attempt => TimeSpan.FromSeconds(attempt), countGivenUp: false);

    /// <summary>Pull request B: "Exponential back-off."</summary>
    public static Task<int> PullRequestB(Deps deps) => Run(deps, lastDay: 3, wait: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)), countGivenUp: false);

    /// <summary>Pull request C: "Report every reminder we handled."</summary>
    public static Task<int> PullRequestC(Deps deps) => Run(deps, lastDay: 3, wait: attempt => TimeSpan.FromSeconds(attempt), countGivenUp: true);

    private static async Task<int> Run(Deps deps, int lastDay, Func<int, TimeSpan> wait, bool countGivenUp)
    {
        DateOnly today = deps.Clock.Today;
        int sent = 0;
        foreach (Refill refill in await deps.Store.DueRefillsAsync())
        {
            if (refill.Due < today || refill.Due > today.AddDays(lastDay)) continue;
            string text = $"Refill for {refill.Patient} due {refill.Due:yyyy-MM-dd}";
            for (int attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    await deps.Sms.SendAsync(refill.Phone, text);
                    sent++;
                    break;
                }
                catch (TimeoutException) when (attempt < 3)
                {
                    await deps.Delay(wait(attempt));
                }
                catch (TimeoutException)
                {
                    if (countGivenUp) sent++;
                }
            }
        }
        return sent;
    }
}

// ---- Yours to write: the spy and the two checks. ----

/// <summary>A spy for the gateway: the first calls time out, the rest succeed and are recorded.</summary>
public sealed class SpySms(int failFirst = 0) : ISmsGateway
{
    /// <summary>The messages that were sent, in order.</summary>
    public List<(string Phone, string Text)> Sent { get; } = [];

    /// <summary>Every call, failed or not.</summary>
    public int Calls { get; private set; }

    public Task SendAsync(string phone, string text)
    {
        throw new NotImplementedException();
    }
}

public static class Checks
{
    /// <summary>True if the job reminds exactly the refills due from today to three days ahead.</summary>
    public static async Task<bool> RemindsOnlyDueSoon(ReminderJob job)
    {
        throw new NotImplementedException();
    }

    /// <summary>True if the job retries timeouts after 1 s and 2 s, gives up after three attempts, and goes on.</summary>
    public static async Task<bool> RetriesTimeouts(ReminderJob job)
    {
        throw new NotImplementedException();
    }
}
