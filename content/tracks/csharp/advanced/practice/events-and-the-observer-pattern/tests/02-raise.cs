// Nobody listens.
var quiet = new SoilSensor("lettuce");
try
{
    quiet.Report(40);
    quiet.Report(0);
}
catch (NullReferenceException)
{
    Check.True(false, "Report does nothing when nobody has subscribed");
}

// Three handlers, in the order they subscribed.
var sensor = new SoilSensor("peppers");
var calls = new List<string>();
object? seenSender = null;
EventHandler<MoistureEventArgs> first = (sender, e) => { calls.Add($"first {e.Percent}"); seenSender = sender; };
EventHandler<MoistureEventArgs> second = (sender, e) => calls.Add($"second {e.Percent}");
EventHandler<MoistureEventArgs> third = (sender, e) => calls.Add($"third {e.Percent}");
sensor.MoistureRead += first;
sensor.MoistureRead += second;
sensor.MoistureRead += third;
sensor.Report(33);
Check.SequenceEqual(calls, ["first 33", "second 33", "third 33"], "every handler receives the reading, in the order they subscribed");
Check.True(ReferenceEquals(seenSender, sensor), "the sender of the event is the sensor that raised it");

// A handler that subscribed twice is called twice.
calls.Clear();
sensor.MoistureRead += first;
sensor.Report(12);
Check.SequenceEqual(calls, ["first 12", "second 12", "third 12", "first 12"], "a handler that subscribed twice is called twice");

// Everyone leaves again: raising is safe once more.
sensor.MoistureRead -= first;
sensor.MoistureRead -= first;
sensor.MoistureRead -= second;
sensor.MoistureRead -= third;
calls.Clear();
try
{
    sensor.Report(50);
}
catch (NullReferenceException)
{
    Check.True(false, "Report does nothing once every subscriber has left");
}
Check.Equal(calls.Count, 0, "no handler is called after every subscriber has left");
