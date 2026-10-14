// A wrong answer can wait for ever, so each call below is given three seconds
// to finish before the test gives up and says what it was waiting for.
async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// 1. The harbour master presses Stop while the second container is in the air.
using var stop = new CancellationTokenSource();
var lifted = new List<string>();
Task Lift(string container, CancellationToken token)
{
    lifted.Add(container);
    if (container == "C2") stop.Cancel();
    return Task.CompletedTask;
}
Task<int> unload = Harbour.UnloadAsync(["C1", "C2", "C3"], Lift, stop.Token);
await Settle(unload, "UnloadAsync finishes after Stop is pressed");
await Check.ThrowsAsync<OperationCanceledException>(() => unload, "a stopped unload ends with an OperationCanceledException");
Check.SequenceEqual(lifted, ["C1", "C2"], "the containers lifted before the stop was noticed");
Check.Equal(unload.Status, TaskStatus.Canceled, "the status of the task of a stopped unload");

int count = await Harbour.UnloadAsync(["C1", "C2"], (container, token) => Task.CompletedTask);
Check.Equal(count, 2, "the number of containers lifted when nobody presses Stop");

// 2. A berth request with a deadline.
string berth = await Harbour.AskWithDeadlineAsync(token => Task.FromResult("berth 7"), TimeSpan.FromSeconds(30));
Check.Equal(berth, "berth 7", "the answer that came within the limit");

async Task<string> NoAnswer(CancellationToken token)
{
    await Task.Delay(Timeout.Infinite, token); // the office never answers
    return "never";
}
Task<string> late = Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromMilliseconds(50));
await Settle(late, "AskWithDeadlineAsync gives up once the limit has passed");
await Check.ThrowsAsync<TimeoutException>(() => late, "a request with no answer within the limit");

using var giveUp = new CancellationTokenSource();
giveUp.Cancel();
Task<string> abandoned = Harbour.AskWithDeadlineAsync(NoAnswer, TimeSpan.FromSeconds(30), giveUp.Token);
await Settle(abandoned, "AskWithDeadlineAsync finishes when the caller has given up");
await Check.ThrowsAsync<OperationCanceledException>(() => abandoned, "a request the caller had already given up on");
