Complete `ReminderDispatcher` in `solution.cs`, using only the base class library. The other
types in the starter are finished; do not change their names or signatures. You may add private
fields and private methods. The gateway is a delegate:

```csharp
public delegate Task SendSms(string phone, string text, CancellationToken cancellationToken);
```

Its task completes when the gateway has accepted the message. It fails with
`GatewayBusyException` when the gateway is overloaded (trying again may work), with
`InvalidNumberException` when the number can never receive messages, and with an
`OperationCanceledException` if its token is canceled while it is waiting.

1. **Constructor** `ReminderDispatcher(SendSms send, int batchSize, int maxAttempts)`.
   Throw `ArgumentNullException` if `send` is `null`, and `ArgumentOutOfRangeException` if
   `batchSize` or `maxAttempts` is less than 1.
2. **`FormatMessage(Appointment appointment)`** returns exactly

   ```text
   Hello {Patient}, this is Larkspur Clinic. Your appointment is on {yyyy-MM-dd} at {HH:mm}.
   ```

   with the date and the 24-hour time of `Start`, for example
   `Hello Ada Lovelace, this is Larkspur Clinic. Your appointment is on 2026-10-15 at 09:30.`
   Format with the invariant culture, so the result is the same on every server.
3. **`SendAllAsync(appointments, cancellationToken)`** sends one reminder per appointment, with
   the text from `FormatMessage`, to the appointment's `Phone`, and returns one
   `ReminderResult` per appointment **in the order of the input**.
   - If `appointments` is `null`, throw `ArgumentNullException` **when `SendAllAsync` is
     called**, not later from the returned task.
   - **Batches.** Take the appointments `batchSize` at a time, in order. Start every send of a
     batch, wait until all of them have finished, then start the next batch. Never have more
     than `batchSize` messages in flight.
   - **Retries.** When a send fails with `GatewayBusyException`, try again at once, up to
     `maxAttempts` attempts in total. If the last attempt is still busy, the outcome is
     `GaveUp`. `InvalidNumberException` gives `InvalidNumber` and is never retried.
   - **Success** gives `Sent`. `Attempts` is the number of times the gateway was called for that
     appointment.
   - **Cancellation.** Pass the token to every gateway call. A send that ends with an
     `OperationCanceledException` *because the token was canceled* gives `Cancelled`. Check the
     token before every attempt: once it is canceled, make no more gateway calls, and report
     every remaining appointment as `Cancelled` with the attempts made so far (0 if none).
     `SendAllAsync` does **not** throw because of cancellation; it returns the full report.
   - **Any other exception** from the gateway is a bug in the setup, not a delivery result:
     let it come out of the awaited `SendAllAsync` unchanged (not wrapped in an
     `AggregateException`).
4. **Event.** Raise `ReminderSent` once for each reminder whose outcome is `Sent`, right after
   the gateway accepts it, with `this` as the sender and a `ReminderSentEventArgs` holding the
   patient and the attempt count. It must be safe to raise when nobody has subscribed.

Example, with a gateway that accepts everything:

```csharp
var dispatcher = new ReminderDispatcher(gateway, batchSize: 2, maxAttempts: 3);
dispatcher.ReminderSent += (sender, e) => Console.WriteLine($"sent to {e.Patient}");

IReadOnlyList<ReminderResult> report = await dispatcher.SendAllAsync(tonight);
// report[0] == new ReminderResult("Ada Lovelace", Outcome.Sent, 1)
```

**Tips**

- Lesson 6 shows how to throw an argument error at the call from a method that returns a task:
  validate in an ordinary method, then call a private `async` one.
- `Enumerable.Chunk(size)` splits a sequence into arrays of at most `size` items, and
  `Task.WhenAll` returns its results in the order of the tasks you gave it, whatever order they
  finish in.
- Exception filters (`catch (...) when (...)`) let you say "busy, and attempts remain" and
  "canceled, and it was our token" in one line each.
- The sends of one batch run at the same time, so keep each result in its own place rather than
  appending to a shared list as sends finish.
