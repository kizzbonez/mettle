async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// An office that never answers, and remembers the token it was given.
var given = new List<CancellationToken>();
async Task<string> NoAnswer(CancellationToken token)
{
    given.Add(token);
    await Task.Delay(Timeout.Infinite, token);
    return "never";
}

// A quick answer, with a token that could be canceled but was not.
CancellationToken seen = default;
string berth = await Harbour.AskWithDeadlineAsync(token =>
{
    seen = token;
    return Task.FromResult("berth 3");
}, TimeSpan.FromMinutes(5));
Check.Equal(berth, "berth 3", "the answer of an office that answered in time");
Check.True(seen.CanBeCanceled, "ask receives a token that the deadline can cancel");
Check.True(!seen.IsCancellationRequested, "a quick answer is not canceled");

// The deadline passes.
Task<string> late = Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromMilliseconds(30));
await Settle(late, "AskWithDeadlineAsync gives up once the limit has passed");
await Check.ThrowsAsync<TimeoutException>(() => late, "a request with no answer within the limit");
Check.True(given.Count == 1 && given[0].IsCancellationRequested, "when the deadline passes, the token given to ask is canceled, so the work stops too");

// The caller gives up while the office is still thinking, long before the deadline.
using var captain = new CancellationTokenSource();
Task<string> waiting = Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromHours(1), captain.Token);
Check.True(!waiting.IsCompleted, "AskWithDeadlineAsync waits while the office is thinking");
captain.Cancel();
await Settle(waiting, "the caller's cancellation reaches ask through the linked token");
Check.True(waiting.IsCanceled, "a request the caller canceled ends in the Canceled state, not as a timeout");
await Check.ThrowsAsync<OperationCanceledException>(() => waiting, "the caller's own cancellation comes out as an OperationCanceledException");

// The caller had given up before asking.
using var gone = new CancellationTokenSource();
gone.Cancel();
Task<string> abandoned = Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromHours(1), gone.Token);
await Settle(abandoned, "AskWithDeadlineAsync finishes when the caller has already given up");
await Check.ThrowsAsync<OperationCanceledException>(() => abandoned, "a request the caller gave up on before asking");

// Other failures pass through unchanged.
Task<string> broken = Harbour.AskWithDeadlineAsync(
    token => Task.FromException<string>(new InvalidOperationException("radio broken")),
    TimeSpan.FromMinutes(5));
await Settle(broken, "AskWithDeadlineAsync finishes when ask fails");
await Check.ThrowsAsync<InvalidOperationException>(() => broken, "an exception from ask that is not a cancellation");
