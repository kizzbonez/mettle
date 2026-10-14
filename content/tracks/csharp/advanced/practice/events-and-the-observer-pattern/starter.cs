// Greenhouse Sensor
//
// A soil sensor publishes its readings through a standard .NET event. Raise it
// safely, reach every handler even when one of them throws, and let a sprinkler
// subscribe and unsubscribe properly.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

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

    protected virtual void OnMoistureRead(MoistureEventArgs e)
    {
        // TODO 1: raise the event, safely when nobody has subscribed
        throw new NotImplementedException();
    }

    /// Publishes one reading to every handler, even when some of them throw.
    /// Returns how many handlers threw.
    public int ReportToEveryone(int percent)
    {
        // TODO 2: call the handlers one by one and count the failures
        throw new NotImplementedException();
    }
}

/// Waters its bed whenever the soil is drier than `dryBelow` percent.
public sealed class Sprinkler(int dryBelow)
{
    // TODO 3: you will need a field to remember the sensor you are attached to

    public int Waterings { get; private set; }

    public void Attach(SoilSensor sensor)
    {
        // TODO 3: subscribe CheckSoil and remember the sensor
        throw new NotImplementedException();
    }

    public void Detach()
    {
        // TODO 4: unsubscribe the same method, then forget the sensor
        throw new NotImplementedException();
    }

    private void CheckSoil(object? sender, MoistureEventArgs e)
    {
        // TODO 3: water when the reading is below dryBelow
        throw new NotImplementedException();
    }
}
