// Appointment Reminder Dispatcher: reference solution.
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
    private readonly SendSms _send;
    private readonly int _batchSize;
    private readonly int _maxAttempts;

    public ReminderDispatcher(SendSms send, int batchSize, int maxAttempts)
    {
        ArgumentNullException.ThrowIfNull(send);
        ArgumentOutOfRangeException.ThrowIfLessThan(batchSize, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(maxAttempts, 1);
        _send = send;
        _batchSize = batchSize;
        _maxAttempts = maxAttempts;
    }

    public event EventHandler<ReminderSentEventArgs>? ReminderSent;

    public static string FormatMessage(Appointment appointment) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"Hello {appointment.Patient}, this is Larkspur Clinic. Your appointment is on {appointment.Start:yyyy-MM-dd} at {appointment.Start:HH:mm}.");

    // Not async: argument errors are thrown at the call, not stored in the task.
    public Task<IReadOnlyList<ReminderResult>> SendAllAsync(
        IEnumerable<Appointment> appointments, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(appointments);
        return SendAllCoreAsync(appointments, cancellationToken);
    }

    private async Task<IReadOnlyList<ReminderResult>> SendAllCoreAsync(
        IEnumerable<Appointment> appointments, CancellationToken cancellationToken)
    {
        var results = new List<ReminderResult>();
        foreach (Appointment[] batch in appointments.Chunk(_batchSize))
        {
            // Start the whole batch, then wait for all of it; WhenAll keeps the order.
            ReminderResult[] finished = await Task.WhenAll(batch.Select(a => SendOneAsync(a, cancellationToken)));
            results.AddRange(finished);
        }
        return results;
    }

    private async Task<ReminderResult> SendOneAsync(Appointment appointment, CancellationToken cancellationToken)
    {
        string text = FormatMessage(appointment);
        int attempts = 0;
        while (true)
        {
            if (cancellationToken.IsCancellationRequested)
                return new ReminderResult(appointment.Patient, Outcome.Cancelled, attempts);

            attempts++;
            try
            {
                await _send(appointment.Phone, text, cancellationToken);
            }
            catch (GatewayBusyException) when (attempts < _maxAttempts)
            {
                continue;
            }
            catch (GatewayBusyException)
            {
                return new ReminderResult(appointment.Patient, Outcome.GaveUp, attempts);
            }
            catch (InvalidNumberException)
            {
                return new ReminderResult(appointment.Patient, Outcome.InvalidNumber, attempts);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new ReminderResult(appointment.Patient, Outcome.Cancelled, attempts);
            }

            OnReminderSent(new ReminderSentEventArgs(appointment.Patient, attempts));
            return new ReminderResult(appointment.Patient, Outcome.Sent, attempts);
        }
    }

    private void OnReminderSent(ReminderSentEventArgs e) => ReminderSent?.Invoke(this, e);
}
