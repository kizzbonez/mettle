`MoistureEventArgs`, the event `SoilSensor.MoistureRead`, `SoilSensor.Report` and
`SoilSensor.SubscriberCount` are complete in the starter. Write the four marked bodies.

1. `SoilSensor.OnMoistureRead(MoistureEventArgs e)` raises `MoistureRead` with the sensor itself
   as the sender. `Report` calls it. It must do nothing when nobody has subscribed.
2. `SoilSensor.ReportToEveryone(int percent)` returns `int`. It raises the event like `Report`,
   with one `MoistureEventArgs` and the sensor as the sender, but calls every handler on its own,
   in the order they subscribed, and **carries on when one throws**: catch the handler's
   exception and go on to the next. Return how many handlers threw (0 when nobody has
   subscribed). No exception comes out of `ReportToEveryone`.
3. `Sprinkler.Attach(SoilSensor sensor)` subscribes the sprinkler's own `CheckSoil` method to
   `sensor.MoistureRead` and remembers the sensor. `CheckSoil` waters (adds one to
   `Waterings`) when the reading is **below** the `dryBelow` given to the constructor.
4. `Sprinkler.Detach()` unsubscribes `CheckSoil` from the sensor it was attached to, and forgets
   that sensor. When the sprinkler is not attached, `Detach` does nothing. Other subscribers of
   the sensor keep receiving readings.

Example:

```csharp
var sensor = new SoilSensor("tomatoes");
var readings = new List<string>();
sensor.MoistureRead += (sender, e) => readings.Add($"{((SoilSensor)sender!).Bed}: {e.Percent}%");
var sprinkler = new Sprinkler(dryBelow: 30);
sprinkler.Attach(sensor);
sensor.SubscriberCount          // 2

sensor.Report(45);
sensor.Report(20);
readings                        // ["tomatoes: 45%", "tomatoes: 20%"]
sprinkler.Waterings             // 1: only 20 is below 30

sprinkler.Detach();
sensor.Report(10);
sprinkler.Waterings             // still 1
sensor.SubscriberCount          // 1

sensor.MoistureRead += (sender, e) => throw new InvalidOperationException("display offline");
sensor.MoistureRead += (sender, e) => readings.Add("logged");
sensor.ReportToEveryone(50)     // 1: one handler threw, and the one after it still ran
readings.Count                  // 5: "tomatoes: 10%", "tomatoes: 50%" and "logged" were added

new SoilSensor("herbs").Report(5);   // nobody listens, and nothing goes wrong
```

**Tip:** `MoistureRead?.GetInvocationList()` gives the handlers one by one, each as a `Delegate`.
A `foreach (EventHandler<MoistureEventArgs> handler in ...)` loop casts each one for you.
