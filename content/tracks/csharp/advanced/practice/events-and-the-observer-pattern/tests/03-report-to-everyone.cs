// Nobody listens.
var quiet = new SoilSensor("beans");
int none = -1;
try
{
    none = quiet.ReportToEveryone(40);
}
catch (NullReferenceException)
{
    Check.True(false, "ReportToEveryone works when nobody has subscribed");
}
Check.Equal(none, 0, "the failures counted when nobody has subscribed");

// Five handlers, and two of them throw.
var sensor = new SoilSensor("cucumbers");
var calls = new List<string>();
var senders = new List<object?>();
var arguments = new List<MoistureEventArgs>();
void Record(string name, object? sender, MoistureEventArgs e)
{
    calls.Add($"{name} {e.Percent}");
    senders.Add(sender);
    arguments.Add(e);
}
sensor.MoistureRead += (sender, e) => Record("display", sender, e);
sensor.MoistureRead += (sender, e) => { Record("radio", sender, e); throw new InvalidOperationException("no signal"); };
sensor.MoistureRead += (sender, e) => Record("logger", sender, e);
sensor.MoistureRead += (sender, e) => { Record("alarm", sender, e); throw new ArgumentException("bad threshold"); };
sensor.MoistureRead += (sender, e) => Record("chart", sender, e);

int failures = -1;
try
{
    failures = sensor.ReportToEveryone(27);
}
catch (Exception e) when (e is not NotImplementedException)
{
    Check.True(false, "no exception comes out of ReportToEveryone");
}
Check.Equal(failures, 2, "the number of handlers that threw");
Check.SequenceEqual(
    calls,
    ["display 27", "radio 27", "logger 27", "alarm 27", "chart 27"],
    "every handler is called, in the order they subscribed, also after one that threw");
Check.True(senders.All(sender => ReferenceEquals(sender, sensor)), "every handler receives the sensor as the sender");
Check.True(arguments.All(e => ReferenceEquals(e, arguments[0])), "every handler receives the same event data");

// Handlers that all behave.
var calm = new SoilSensor("chard");
int heard = 0;
calm.MoistureRead += (sender, e) => heard++;
calm.MoistureRead += (sender, e) => heard++;
Check.Equal(calm.ReportToEveryone(60), 0, "the failures counted when no handler throws");
Check.Equal(heard, 2, "every handler is called when none throws");

// Every handler throws.
var broken = new SoilSensor("kale");
broken.MoistureRead += (sender, e) => throw new InvalidOperationException("one");
broken.MoistureRead += (sender, e) => throw new InvalidOperationException("two");
broken.MoistureRead += (sender, e) => throw new InvalidOperationException("three");
Check.Equal(broken.ReportToEveryone(5), 3, "the failures counted when every handler throws");
