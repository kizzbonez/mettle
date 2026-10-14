The types and the properties are written, with their default values. Write four members.

**Logging.** `LineLogger` has a category, a minimum level and a sink.

1. `bool IsEnabled(Level level)` is `true` when `level` is at or above the minimum. `Level.None`
   is never enabled, so a minimum of `None` turns the logger off.
2. `void Log(Level level, string template, params object?[] args)` writes **one line** to the
   sink:

   ```text
   level=Warning category=Snowmaking.Pumps template="Pump {Pump} pressure {Bar} bar" Pump=3 Bar=12.5
   ```

   - First `level`, `category` and the template itself in double quotes, then one
     `Name=value` field for each placeholder, in the order the placeholders appear. Fields
     are separated by single spaces.
   - A placeholder is `{`, one or more letters, digits or underscores, and `}`. Placeholders
     bind to `args` **by position**, not by name. If the number of placeholders and the number
     of `args` differ, throw `ArgumentException`.
   - A value is written with the invariant culture when it is `IFormattable` (numbers, dates),
     as `null` when it is null, and with `ToString()` otherwise.
   - The value of a field whose name is in `SecretNames` (ignoring case, the whole name) is
     written as `***`.
   - If the level is not enabled, return at once: write nothing, and do not even look at the
     template or the arguments.

**Configuration.**

3. `static SnowOptions Bind(params IReadOnlyDictionary<string, string>[] sources)` layers the
   sources in the order given, like `appsettings.json`, then environment variables, then the
   command line: **a key in a later source overrides** the same key in an earlier one.
   - Keys ignore case, and `__` in a key means `:` (that is how environment variables write
     it): `SNOW__MAXPUMPS` and `Snow:MaxPumps` are the same key.
   - Bind `Snow:Endpoint`, `Snow:TargetDepthCm` and `Snow:MaxPumps`. Ignore every other key. A
     key that no source sets keeps the property's default.
   - Numbers are whole numbers read with the invariant culture. One that does not parse
     throws `FormatException` whose message contains the key, such as `Snow:MaxPumps`.
4. `string[] Validate()` returns every rule the settings break, with exactly these messages,
   in this order, and an empty array when there are none:
   - `Endpoint must be an absolute http or https URL`
   - `TargetDepthCm must be 10 to 200` (both limits allowed)
   - `MaxPumps must be 1 to 32` (both limits allowed)

Example:

```csharp
var sink = new ListSink();
var log = new LineLogger("Snowmaking.Pumps", Level.Information, sink);
log.Log(Level.Warning, "Pump {Pump} pressure {Bar} bar", 3, 12.5);
log.Log(Level.Debug, "Valve {Valve} opened", 7);                  // below the minimum: nothing
log.Log(Level.Information, "Pump {Pump} paired with {Token}", 3, "s3cr3t");
sink.Lines
// level=Warning category=Snowmaking.Pumps template="Pump {Pump} pressure {Bar} bar" Pump=3 Bar=12.5
// level=Information category=Snowmaking.Pumps template="Pump {Pump} paired with {Token}" Pump=3 Token=***

SnowOptions options = SnowOptions.Bind(
    new Dictionary<string, string> { ["Snow:Endpoint"] = "https://pumps.internal", ["Snow:MaxPumps"] = "6" },
    new Dictionary<string, string> { ["SNOW__MAXPUMPS"] = "40" });
(options.Endpoint, options.TargetDepthCm, options.MaxPumps)   // ("https://pumps.internal", 40, 40)
options.Validate()                                            // ["MaxPumps must be 1 to 32"]
```

**Tips**

- `Regex.Matches(template, @"\{(\w+)\}")` finds the placeholders; `Groups[1].Value` is a name.
  The starter already has `using System.Text.RegularExpressions;`.
- A `Dictionary<string, string>` made with `StringComparer.OrdinalIgnoreCase` ignores the case
  of its keys; writing every source into it in order lets the later ones win.
- `Uri.TryCreate(text, UriKind.Absolute, out Uri? uri)` and then `uri.Scheme`: on Linux a path
  such as `/pumps` is an absolute `file` URI, so the scheme matters.
