// Appointment Reminder Dispatcher
//
// The types at the top are finished: they describe the gateway and the data.
// Every `throw new NotImplementedException();` in ReminderDispatcher marks code
// you still have to write. You may add private fields and private methods.
using System.Globalization;

/// <summary>Sends one text message. Supplied by the clinic's SMS gateway client.</summary>
public delegate Task SendSms(string phone, string text, CancellationToken cancellationToken);

/// <summary>The gateway is overloaded right now. Trying again may work.</summary>
public sealed class GatewayBusyException : Exception
{
    public GatewayBusyException() : base("The SMS gateway is busy.") { }
    public GatewayBusyException(string message) : base(message) { }
    public GatewayBusyException(string message, Exception inner) : base(message, inner) { }
}

/// <summary>The number can never receive messages. Trying again will not help.</summary>
public sealed class InvalidNumberException : Exception
{
    public InvalidNumberException() : base("The phone number cannot receive messages.") { }
    public InvalidNumberException(string message) : base(message) { }
    public InvalidNumberException(string message, Exception inner) : base(message, inner) { }
}

public sealed record Appointment(string Patient, string Phone, DateTime Start);

public enum Outcome
{
    Sent,
    InvalidNumber,
    GaveUp,
    Cancelled,
}

public sealed record ReminderResult(string Patient, Outcome Outcome, int Attempts);

public sealed class ReminderSentEventArgs(string patient, int attempts) : EventArgs
{
    public string Patient { get; } = patient;
    public int Attempts { get; } = attempts;
}

public sealed class ReminderDispatcher
{
    public ReminderDispatcher(SendSms send, int batchSize, int maxAttempts)
    {
        // TODO 1: validate the arguments and keep them
        throw new NotImplementedException();
    }

    /// <summary>Raised once for every reminder the gateway accepted.</summary>
    public event EventHandler<ReminderSentEventArgs>? ReminderSent;

    /// <summary>The text of one reminder (see the instructions for the exact wording).</summary>
    public static string FormatMessage(Appointment appointment)
    {
        // TODO 2
        throw new NotImplementedException();
    }

    /// <summary>Sends every reminder in batches and reports one result per appointment, in order.</summary>
    public Task<IReadOnlyList<ReminderResult>> SendAllAsync(
        IEnumerable<Appointment> appointments, CancellationToken cancellationToken = default)
    {
        // TODO 3: batches, retries, cancellation and the ReminderSent event
        throw new NotImplementedException();
    }
}
