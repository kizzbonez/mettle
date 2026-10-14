// Greenhouse Sensor
//
// A soil sensor publishes its readings through a standard .NET event. Raise it
// safely, reach every handler even when one of them throws, and let a sprinkler
// subscribe and unsubscribe properly.

/// One reading: how damp the soil is, in percent.
public sealed class MoistureEventArgs(int percent) : EventArgs
{
    public int Percent { get; } = percent;
}

public class SoilSensor(string bed)
{
    public string Bed { get; } = bed;

    public event EventHandler<MoistureEventArgs>? MoistureRead;

    /// How many handlers are subscribed right now.
    public int SubscriberCount => MoistureRead?.GetInvocationList().Length ?? 0;

    /// Publishes one reading.
    public void Report(int percent) => OnMoistureRead(new MoistureEventArgs(percent));

    // `?.` reads the field once and does nothing when it is null.
    protected virtual void OnMoistureRead(MoistureEventArgs e) => MoistureRead?.Invoke(this, e);

    /// Publishes one reading to every handler, even when some of them throw.
    /// Returns how many handlers threw.
    public int ReportToEveryone(int percent)
    {
        if (MoistureRead is not { } handlers) return 0;

        var reading = new MoistureEventArgs(percent);
        int failures = 0;
        foreach (EventHandler<MoistureEventArgs> handler in handlers.GetInvocationList())
        {
            try
            {
                handler(this, reading);
            }
            catch (Exception)
            {
                failures++;
            }
        }
        return failures;
    }
}

/// Waters its bed whenever the soil is drier than `dryBelow` percent.
public sealed class Sprinkler(int dryBelow)
{
    private SoilSensor? _sensor;

    public int Waterings { get; private set; }

    public void Attach(SoilSensor sensor)
    {
        sensor.MoistureRead += CheckSoil;
        _sensor = sensor;
    }

    public void Detach()
    {
        // The same method, so -= finds the delegate that += added.
        if (_sensor is null) return;
        _sensor.MoistureRead -= CheckSoil;
        _sensor = null;
    }

    private void CheckSoil(object? sender, MoistureEventArgs e)
    {
        if (e.Percent < dryBelow) Waterings++;
    }
}
