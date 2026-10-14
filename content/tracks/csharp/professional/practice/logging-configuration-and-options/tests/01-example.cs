// The example from the instructions.
var sink = new ListSink();
var log = new LineLogger("Snowmaking.Pumps", Level.Information, sink);
log.Log(Level.Warning, "Pump {Pump} pressure {Bar} bar", 3, 12.5);
log.Log(Level.Debug, "Valve {Valve} opened", 7);
log.Log(Level.Information, "Pump {Pump} paired with {Token}", 3, "s3cr3t");
Check.SequenceEqual(sink.Lines,
[
    "level=Warning category=Snowmaking.Pumps template=\"Pump {Pump} pressure {Bar} bar\" Pump=3 Bar=12.5",
    "level=Information category=Snowmaking.Pumps template=\"Pump {Pump} paired with {Token}\" Pump=3 Token=***",
], "the lines written for a warning, a debug event below the minimum, and an event with a token");

SnowOptions options = SnowOptions.Bind(
    new Dictionary<string, string> { ["Snow:Endpoint"] = "https://pumps.internal", ["Snow:MaxPumps"] = "6" },
    new Dictionary<string, string> { ["SNOW__MAXPUMPS"] = "40" });
Check.Equal((options.Endpoint, options.TargetDepthCm, options.MaxPumps), ("https://pumps.internal", 40, 40),
    "Endpoint, TargetDepthCm and MaxPumps bound from a file and an environment variable");
Check.SequenceEqual(options.Validate(), ["MaxPumps must be 1 to 32"], "the errors of the bound settings");
