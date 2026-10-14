var sensor = new SoilSensor("tomatoes");
var readings = new List<string>();
sensor.MoistureRead += (sender, e) => readings.Add($"{((SoilSensor)sender!).Bed}: {e.Percent}%");
var sprinkler = new Sprinkler(dryBelow: 30);
sprinkler.Attach(sensor);
Check.Equal(sensor.SubscriberCount, 2, "the subscribers after a logger and a sprinkler subscribed");

sensor.Report(45);
sensor.Report(20);
Check.SequenceEqual(readings, ["tomatoes: 45%", "tomatoes: 20%"], "the readings the logger received");
Check.Equal(sprinkler.Waterings, 1, "the waterings after readings of 45 and 20 with dryBelow 30");

sprinkler.Detach();
sensor.Report(10);
Check.Equal(sprinkler.Waterings, 1, "the waterings after the sprinkler was detached and the soil read 10");
Check.Equal(sensor.SubscriberCount, 1, "the subscribers after the sprinkler was detached");

sensor.MoistureRead += (sender, e) => throw new InvalidOperationException("display offline");
sensor.MoistureRead += (sender, e) => readings.Add("logged");
Check.Equal(sensor.ReportToEveryone(50), 1, "the number of handlers that threw");
Check.SequenceEqual(
    readings,
    ["tomatoes: 45%", "tomatoes: 20%", "tomatoes: 10%", "tomatoes: 50%", "logged"],
    "the readings, including the handler after the one that threw");

try
{
    new SoilSensor("herbs").Report(5);
}
catch (NullReferenceException)
{
    Check.True(false, "Report on a sensor that nobody listens to");
}
