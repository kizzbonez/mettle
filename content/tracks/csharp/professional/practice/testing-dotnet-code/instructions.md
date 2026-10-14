A reminder job takes its dependencies in one `Deps` record and returns how many reminders it
sent. Here is what a job must do:

- It reads today's date from `Clock` and the refills from `Store`, and goes through them in
  the store's order.
- It reminds a refill whose `Due` is **from today to three days after today**, both days
  included. It skips every other refill.
- A reminder is the text `Refill for <Patient> due <Due as yyyy-MM-dd>`, sent to `Phone`.
- When `SendAsync` throws `TimeoutException`, the job awaits `Delay` and tries again: **1
  second** before the second attempt and **2 seconds** before the third. After a third timeout
  it gives up on that refill, does not count it, and goes on with the next one.
- It returns the number of reminders that went through.

`Jobs.Correct` does exactly that. `PullRequestA`, `B` and `C` each break one rule. `StubClock`
(a stub) and `FakeStore` (a fake) are written. Leave all of these as they are.

**How your work is judged.** The tests cannot run xUnit, so you write the tests as code they
can call. They run your two checks on `Jobs.Correct` and on other correct jobs, which must
**pass** (`true`), and on the three pull requests and on **faulty jobs you have not seen**,
which must **fail** (`false`). A check that fails everything, or one that misses a rule, is
caught.

1. `SpySms(int failFirst = 0)`: write `SendAsync`. It counts every call in `Calls`. The first
   `failFirst` calls throw `TimeoutException`; every later call adds `(phone, text)` to
   `Sent`, in order, and completes.
2. `Task<bool> Checks.RemindsOnlyDueSoon(ReminderJob job)` arranges one run of the job with a
   `StubClock` on a fixed date of your choice (not the real date), a `FakeStore`, a `SpySms`
   that never fails, and a delay that records what it is asked and returns at once. It
   returns `true` only if the job sent exactly the right reminders, with the right texts, to
   the right phones, in the store's order, and returned their number. Give it refills that
   show every edge: due yesterday, today, three days ahead, four days ahead, and one in
   between.
3. `Task<bool> Checks.RetriesTimeouts(ReminderJob job)` runs the job twice, with refills inside
   the window:
   - with a `SpySms(failFirst: 2)` and one refill: the reminder goes through on the third
     call, the job waited exactly 1 s and then 2 s, and it returns 1;
   - with a `SpySms(failFirst: 3)` and two refills: the first is given up after its third call,
     with no fourth, the second is sent, the waits are again exactly 1 s and 2 s, and the job
     returns 1.

   It returns `true` only if both runs went exactly like that.

The delay you pass is a test double too: `wait => { waits.Add(wait); return Task.CompletedTask; }`
makes the job's back-off instant and lets you check it exactly.

Example:

```csharp
var sms = new SpySms(failFirst: 1);
await sms.SendAsync("+4790000001", "hello")       // throws TimeoutException
await sms.SendAsync("+4790000002", "again");
sms.Calls                                         // 2
sms.Sent                                          // [("+4790000002", "again")]

await Checks.RemindsOnlyDueSoon(Jobs.Correct)     // true
await Checks.RetriesTimeouts(Jobs.Correct)        // true
await Checks.RemindsOnlyDueSoon(Jobs.PullRequestA)   // false: it misses a day of the window
await Checks.RetriesTimeouts(Jobs.PullRequestB)      // false: it waits 2 s and 4 s
await Checks.RemindsOnlyDueSoon(Jobs.PullRequestB)   // true: with no timeouts it behaves
```

**Tips**

- Structure each check as Arrange, Act, Assert. The Assert part is one `bool` expression.
- `sms.Sent.SequenceEqual(expected)` compares two lists element by element, in order.
- A job that reads `DateTime.UtcNow` instead of `Clock` is one of the faulty jobs: a fixed date
  that is not today is what exposes it.
