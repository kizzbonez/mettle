// Layering, binding and validation.
static Dictionary<string, string> Source(params (string Key, string Value)[] pairs) =>
    pairs.ToDictionary(pair => pair.Key, pair => pair.Value);

const string Valid = "http://10.0.4.2:8080/pumps";

// No sources: every default stays.
SnowOptions defaults = SnowOptions.Bind();
Check.Equal((defaults.Endpoint, defaults.TargetDepthCm, defaults.MaxPumps), ("", 40, 4), "the settings bound from no sources");

// A later source overrides an earlier one, key by key.
var appsettings = Source(("Snow:Endpoint", "https://old.internal"), ("Snow:TargetDepthCm", "60"), ("Snow:MaxPumps", "8"));
var environment = Source(("Snow__TargetDepthCm", "80"), ("SNOW__ENDPOINT", Valid));
var commandLine = Source(("snow:targetdepthcm", "90"));
SnowOptions layered = SnowOptions.Bind(appsettings, environment, commandLine);
Check.Equal((layered.Endpoint, layered.TargetDepthCm, layered.MaxPumps), (Valid, 90, 8),
    "settings from a file, environment variables and the command line, in that order");
SnowOptions reversed = SnowOptions.Bind(commandLine, environment, appsettings);
Check.Equal((reversed.Endpoint, reversed.TargetDepthCm, reversed.MaxPumps), ("https://old.internal", 60, 8),
    "the same sources in the opposite order, so the file comes last and wins");

// Only the keys of the Snow section.
SnowOptions other = SnowOptions.Bind(Source(
    ("Logging:LogLevel:Default", "Debug"),
    ("Snowfall:MaxPumps", "12"),
    ("MaxPumps", "13"),
    ("Snow:MaxPumpsPerLine", "14"),
    ("Snow:Pumps:MaxPumps", "15")));
Check.Equal((other.Endpoint, other.TargetDepthCm, other.MaxPumps), ("", 40, 4), "keys outside the three keys of the Snow section are ignored");

// Numbers.
Check.Equal(SnowOptions.Bind(Source(("Snow:MaxPumps", " 12 "))).MaxPumps, 12, "a whole number with spaces around it");
Check.Equal(SnowOptions.Bind(Source(("Snow:TargetDepthCm", "-5"))).TargetDepthCm, -5, "a negative whole number is bound, and left to Validate");
foreach (var (key, text) in new[] { ("Snow:MaxPumps", "eight"), ("Snow:MaxPumps", "8.5"), ("SNOW__TARGETDEPTHCM", "40cm"), ("Snow:TargetDepthCm", "") })
{
    string? message = null;
    try
    {
        SnowOptions.Bind(Source((key, text)));
    }
    catch (FormatException error)
    {
        message = error.Message;
    }
    Check.True(message is not null, $"binding \"{text}\" to {key} throws FormatException");
    string name = key.Replace("__", ":").Equals("Snow:MaxPumps", StringComparison.OrdinalIgnoreCase) ? "Snow:MaxPumps" : "Snow:TargetDepthCm";
    Check.True(message!.Contains(name, StringComparison.OrdinalIgnoreCase), $"the message for \"{text}\" names the key {name}");
}

// Validation.
SnowOptions With(string endpoint, int depth, int pumps) =>
    new() { Endpoint = endpoint, TargetDepthCm = depth, MaxPumps = pumps };

Check.SequenceEqual(With(Valid, 40, 4).Validate(), [], "the errors of valid settings");
Check.SequenceEqual(With("https://pumps.internal", 10, 1).Validate(), [], "the errors of settings at the lower limits");
Check.SequenceEqual(With("https://pumps.internal", 200, 32).Validate(), [], "the errors of settings at the upper limits");
Check.SequenceEqual(With(Valid, 9, 4).Validate(), ["TargetDepthCm must be 10 to 200"], "the errors of a depth below the limit");
Check.SequenceEqual(With(Valid, 201, 4).Validate(), ["TargetDepthCm must be 10 to 200"], "the errors of a depth above the limit");
Check.SequenceEqual(With(Valid, 40, 0).Validate(), ["MaxPumps must be 1 to 32"], "the errors of no pumps");
Check.SequenceEqual(With(Valid, 40, 33).Validate(), ["MaxPumps must be 1 to 32"], "the errors of too many pumps");
foreach (string endpoint in new[] { "", "pumps.internal", "/pumps", "ftp://pumps.internal", "https//pumps.internal" })
    Check.SequenceEqual(With(endpoint, 40, 4).Validate(), ["Endpoint must be an absolute http or https URL"],
        $"the errors of the endpoint \"{endpoint}\"");
Check.SequenceEqual(SnowOptions.Bind().Validate(), ["Endpoint must be an absolute http or https URL"],
    "the errors of the defaults, which have no endpoint");
Check.SequenceEqual(With("", 0, 99).Validate(),
    ["Endpoint must be an absolute http or https URL", "TargetDepthCm must be 10 to 200", "MaxPumps must be 1 to 32"],
    "every error of settings that break all three rules, in order");
